# This performs the crowd simulation using numpy and the visualization is done with matplotlib 
# Features:
# Crowd Simulation with grid size, num people, steps, obstacle ratio etc.
# Cummulative heatmap generation
# Prediction of future crowd movement using LSTM
# Density Aware Shortest Path Calculation

import os
import numpy as np
import matplotlib
matplotlib.use('TkAgg')  # or 'Qt5Agg'
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
from scipy.ndimage import gaussian_filter
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Reshape
from pathfinding_system import PathfindingSystem
from pathfinding_system import plot_pathfinding_results

# Config
GRID_SIZE = 50
NUM_PEOPLE = 100
OBSTACLE_RATIO = 0.02
STEPS = 100
LSTM_START_STEP = 50
SEQUENCE_LENGTH = 10

# Define start and goal for path finding
start = (2, 2)
goal = (47, 30)

# Grid cell meanings
# 0: empty, 
# -1: obstacle, 
# 1: person

# Initialize grid
grid = np.zeros((GRID_SIZE, GRID_SIZE), dtype=int)

# Initialize graphs (figures and axis)
fig1 = plt.figure(1, figsize=(7, 7))
ax1 = fig1.add_subplot(1, 1, 1)

fig2 = plt.figure(2, figsize=(7, 7))  
ax2 = fig2.add_subplot(1, 1, 1)

fig3 , (ax3, ax4) = plt.subplots(1, 2, figsize=(14, 6))
accuracy_text_obj = None

# Cummulative heat
cumulative_heat = np.zeros((GRID_SIZE, GRID_SIZE), dtype=float)

# Place obstacles
num_obstacles = int(GRID_SIZE * GRID_SIZE * OBSTACLE_RATIO)
obstacle_indices = np.random.choice(GRID_SIZE * GRID_SIZE, num_obstacles, replace=False)
for idx in obstacle_indices:
    x, y = divmod(idx, GRID_SIZE)
    grid[x, y] = -1  # obstacle


# Store obstacle positions for later use
obstacles = np.where(grid == -1)
obstacle_positions = set(zip(obstacles[0], obstacles[1]))

# Place people
people = []
while len(people) < NUM_PEOPLE:
    x, y = np.random.randint(0, GRID_SIZE, size=2)
    if grid[x, y] == 0:
        grid[x, y] = 1
        people.append((x, y))

def get_best_move(pos, current_grid):
    x, y = pos
    directions = [(-1,0), (1,0), (0,-1), (0,1)]  # up, down, left, right
    best_score = -1
    best_moves = []

    for dx, dy in directions:
        nx, ny = x + dx, y + dy
        if 0 <= nx < GRID_SIZE and 0 <= ny < GRID_SIZE and current_grid[nx, ny] == 0:
            # Score based on number of nearby people (encourage clustering)
            score = 0
            for ax, ay in directions:
                adj_x, adj_y = nx + ax, ny + ay
                if 0 <= adj_x < GRID_SIZE and 0 <= adj_y < GRID_SIZE and current_grid[adj_x, adj_y] == 1:
                    score += 1

            if score > best_score:
                best_score = score
                best_moves = [(nx, ny)]
            elif score == best_score:
                best_moves.append((nx, ny))

    if best_moves:
        return best_moves[np.random.randint(len(best_moves))]
    else:
        return pos

def create_lstm_model():
    model = Sequential([
        LSTM(128, return_sequences=True, input_shape=(SEQUENCE_LENGTH, GRID_SIZE * GRID_SIZE)),
        LSTM(64, return_sequences=False),
        Dense(128, activation='relu'),
        Dense(GRID_SIZE * GRID_SIZE, activation='sigmoid'),
        Reshape((GRID_SIZE, GRID_SIZE))
    ])
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    return model

def prepare_lstm_data(grid_history, start_idx, end_idx):
    """Prepare sequences for LSTM training"""
    # Normalize grids to 0-1 range for LSTM
    normalized_grids = []
    for g in grid_history[start_idx:end_idx]:
        # Convert grid: obstacles=-1->0, empty=0->0.5, people=1->1
        norm_grid = np.copy(g).astype(float)
        norm_grid[norm_grid == -1] = 0  # obstacles
        norm_grid[norm_grid == 0] = 0.5  # empty spaces
        norm_grid[norm_grid == 1] = 1.0  # people
        normalized_grids.append(norm_grid.flatten())

    return np.array(normalized_grids)

def denormalize_prediction(pred_grid):
    """Convert LSTM prediction back to grid format"""
    result = np.zeros_like(pred_grid, dtype=int)

    # First, place obstacles back
    for pos in obstacle_positions:
        result[pos] = -1
        pred_grid[pos] = 0  # Remove from people consideration

    # Find top NUM_PEOPLE positions for people placement
    flat_pred = pred_grid.flatten()
    # Exclude obstacle positions
    valid_positions = []
    for i, val in enumerate(flat_pred):
        x, y = divmod(i, GRID_SIZE)
        if (x, y) not in obstacle_positions:
            valid_positions.append((i, val))

    # Sort by prediction value and take top NUM_PEOPLE
    valid_positions.sort(key=lambda x: x[1], reverse=True)
    top_positions = valid_positions[:NUM_PEOPLE]

    for pos_idx, _ in top_positions:
        x, y = divmod(pos_idx, GRID_SIZE)
        result[x, y] = 1

    return result

def calculate_accuracy_metrics(real_grid, pred_grid):
    """Calculate comprehensive accuracy metrics"""

    # 1. Overall Grid Accuracy (percentage of correct cells)
    total_cells = GRID_SIZE * GRID_SIZE
    correct_cells = np.sum(real_grid == pred_grid)
    overall_accuracy = (correct_cells / total_cells) * 100

    # 2. People Position Accuracy
    real_people_pos = set(zip(*np.where(real_grid == 1)))
    pred_people_pos = set(zip(*np.where(pred_grid == 1)))

    if len(real_people_pos) > 0:
        correct_people = len(real_people_pos.intersection(pred_people_pos))
        position_accuracy = (correct_people / NUM_PEOPLE) * 100
    else:
        position_accuracy = 0

    # 3. Clustering Pattern Accuracy (neighborhood similarity)
    clustering_score = 0
    total_people = 0

    for x in range(1, GRID_SIZE-1):
        for y in range(1, GRID_SIZE-1):
            if real_grid[x, y] == 1:  # If there's a person in real grid
                total_people += 1
                # Check 3x3 neighborhood
                real_neighbors = np.sum(real_grid[x-1:x+2, y-1:y+2] == 1) - 1  # exclude center
                pred_neighbors = np.sum(pred_grid[x-1:x+2, y-1:y+2] == 1) - (1 if pred_grid[x,y] == 1 else 0)

                # Calculate similarity (max possible neighbors is 8)
                if real_neighbors > 0 or pred_neighbors > 0:
                    similarity = 1 - abs(real_neighbors - pred_neighbors) / max(8, max(real_neighbors, pred_neighbors))
                    clustering_score += similarity

    clustering_accuracy = (clustering_score / max(1, total_people)) * 100 if total_people > 0 else 0

    # 4. Movement Direction Accuracy (if we have previous grids)
    direction_accuracy = 0
    if len(grid_history) >= 2:
        prev_real = grid_history[-2]

        prev_real_people = set(zip(*np.where(prev_real == 1)))
        curr_real_people = set(zip(*np.where(real_grid == 1)))
        curr_pred_people = set(zip(*np.where(pred_grid == 1)))

        # Simple movement pattern check
        real_center_x = np.mean([pos[0] for pos in curr_real_people]) if curr_real_people else 0
        real_center_y = np.mean([pos[1] for pos in curr_real_people]) if curr_real_people else 0
        pred_center_x = np.mean([pos[0] for pos in curr_pred_people]) if curr_pred_people else 0
        pred_center_y = np.mean([pos[1] for pos in curr_pred_people]) if curr_pred_people else 0

        prev_center_x = np.mean([pos[0] for pos in prev_real_people]) if prev_real_people else 0
        prev_center_y = np.mean([pos[1] for pos in prev_real_people]) if prev_real_people else 0

        real_dx = real_center_x - prev_center_x
        real_dy = real_center_y - prev_center_y
        pred_dx = pred_center_x - prev_center_x
        pred_dy = pred_center_y - prev_center_y

        # Calculate direction similarity
        if abs(real_dx) + abs(real_dy) > 0.1:  # If there was significant movement
            direction_similarity = 1 - (abs(real_dx - pred_dx) + abs(real_dy - pred_dy)) / (abs(real_dx) + abs(real_dy) + 1e-6)
            direction_accuracy = max(0, direction_similarity * 100)

    return {
        'overall': overall_accuracy,
        'position': position_accuracy,
        'clustering': clustering_accuracy,
        'direction': direction_accuracy
    }

def plot_dual_grid(real_grid, pred_grid, real_step, lstm_step, accuracy_metrics):
    # Display both real simulation and LSTM prediction side by side with accuracy metrics
    global accuracy_text_obj

    cmap = ListedColormap(['white', 'blue', 'black'])  # empty, people, obstacles

    # Clear previous images
    ax3.clear()
    ax4.clear()

    # Real simulation
    display_real = np.copy(real_grid)
    display_real[display_real == -1] = 2
    ax3.imshow(display_real, cmap=cmap)
    ax3.set_title(f"Real Simulation - Step {real_step}")
    ax3.axis('off')

    # LSTM prediction
    display_pred = np.copy(pred_grid)
    display_pred[display_pred == -1] = 2
    ax4.imshow(display_pred, cmap=cmap)
    ax4.set_title(f"LSTM Prediction - Step {lstm_step}")
    ax4.axis('off')

    # Add accuracy information as text below the plots
    fig3.suptitle(f"Crowd Movement Prediction Comparison", fontsize=16, fontweight='bold')

    # Adjust layout first
    plt.subplots_adjust(bottom=0.15)  # Make room for the accuracy text

    # Remove old accuracy text if exists
    if accuracy_text_obj is not None:
        accuracy_text_obj.remove()

    # Create accuracy text
    accuracy_text = (f"Accuracy Metrics:\n"
                    f"Overall: {accuracy_metrics['overall']:.1f}% | "
                    f"Position: {accuracy_metrics['position']:.1f}% | "
                    f"Clustering: {accuracy_metrics['clustering']:.1f}% | "
                    f"Direction: {accuracy_metrics['direction']:.1f}%")

    # Add text below the subplots
    accuracy_text_obj = fig3.text(0.5, 0.02, accuracy_text, ha='center', fontsize=12,
        bbox=dict(boxstyle="round,pad=0.3", facecolor="lightgray", alpha=0.7))

    plt.pause(0.2)

def plot_grid(grid, step):
    cmap = ListedColormap(['white', 'blue', 'black'])
    # clear previous images
    ax1.clear()

    display = np.copy(grid)
    display[display == -1] = 2
    ax1.imshow(display, cmap=cmap)
    ax1.set_title(f"Mela Crowd Movement - Step {step}")
    ax1.axis('off')
    plt.pause(0.2)

def plot_blurry_heatmap(heat_data, step, sigma=1.5, output_dir="heatmaps"):
    global fig2, ax2  # So we can recreate ax2 after clearing

    fig2.clf()  # Clear entire figure
    ax2 = fig2.add_subplot(1, 1, 1)  # Recreate axis
    blurred = gaussian_filter(heat_data, sigma=sigma)

    im = ax2.imshow(blurred, cmap='hot', interpolation='bilinear')  # 'hot' = red-orange
    ax2.set_title(f"Blurry Heatmap - Step {step}")
    ax2.axis('off')

    # Add new colorbar
    fig2.colorbar(im, ax=ax2)
    plt.pause(0.2)

def save_heatmap(heat_data, step, output_dir="heatmaps"):
    os.makedirs(output_dir, exist_ok=True)  # Create the directory if it doesn't exist
    
    plt.figure(figsize=(7, 7))
    blurred = gaussian_filter(heat_data, sigma=1.5)
    plt.imshow(blurred, cmap='hot', interpolation='bilinear')
    
    # Remove axes and border
    plt.axis('off')
    plt.gca().set_position([0, 0, 1, 1])  # Expand image to full figure without margins

    # Save as PNG without padding or extra borders
    filepath = os.path.join(output_dir, f"heatmap_step_{step:03d}.png")
    plt.savefig(filepath, bbox_inches='tight', pad_inches=0)
    plt.close()

def path_finding(grid, start, goal):
    #----------------------------------------path-------------------------------------------------------
    # Initialize pathfinding system
    pathfinder = PathfindingSystem(GRID_SIZE)

    # Calculate density grid
    density_grid = pathfinder.calculate_density_grid(grid)

    # Find multiple paths
    paths_data = pathfinder.find_multiple_paths(start, goal, grid)

    # Smooth the best path
    if paths_data:
        best_path = min(paths_data, key=lambda x: x['cost'])
        smoothed_path = pathfinder.smooth_path(best_path['path'], grid)
        paths_data.append({
            'path': smoothed_path,
            'cost': best_path['cost'] * 0.95,  # Approximate cost reduction
            'strategy': 'Smoothed Best Path'
        })

    # Display results
    plot_pathfinding_results(grid, density_grid, paths_data, 1, start, goal)


# Storage for grid history and accuracy tracking
grid_history = []
lstm_model = None
accuracy_scores = []
position_accuracies = []
clustering_accuracies = []

# Run simulation
print("Starting simulation with LSTM prediction...")

for step in range(STEPS):
    # Store current grid
    grid_history.append(np.copy(grid))

    # Update simulation
    new_grid = np.copy(grid)
    new_positions = []

    np.random.shuffle(people)

    for pos in people:
        x, y = pos
        new_grid[x, y] = 0
        new_pos = get_best_move(pos, new_grid)
        new_grid[new_pos] = 1
        new_positions.append(new_pos)
        cumulative_heat[x, y] += 1

    grid = new_grid
    people = new_positions


    #-----------------------------------------------------------------------------------------------------

    # Handle LSTM prediction after step 10
    if step < LSTM_START_STEP:
        # Show only real simulation
        plot_grid(grid, step)
        plot_blurry_heatmap(cumulative_heat, step)
        save_heatmap(cumulative_heat, step)
    else:
        # Start LSTM predictions
        if step == LSTM_START_STEP:
            print("Training initial LSTM model...")
            lstm_model = create_lstm_model()

            # Train on steps 0-9 to predict step 10
            if len(grid_history) >= SEQUENCE_LENGTH:
                train_data = prepare_lstm_data(grid_history, 0, SEQUENCE_LENGTH)
                X_train = train_data[:-1].reshape(1, SEQUENCE_LENGTH-1, -1)
                y_train = train_data[-1].reshape(1, GRID_SIZE, GRID_SIZE)

                lstm_model.fit(X_train, y_train, epochs=50, verbose=0)

        # Make prediction
        if len(grid_history) >= SEQUENCE_LENGTH and lstm_model is not None:
            # Use last SEQUENCE_LENGTH grids to predict next
            start_idx = max(0, len(grid_history) - SEQUENCE_LENGTH)
            pred_data = prepare_lstm_data(grid_history, start_idx, len(grid_history))

            if len(pred_data) >= SEQUENCE_LENGTH - 1:
                X_pred = pred_data[-(SEQUENCE_LENGTH-1):].reshape(1, SEQUENCE_LENGTH-1, -1)

                # Predict next grid
                pred_raw = lstm_model.predict(X_pred, verbose=0)[0]
                pred_grid = denormalize_prediction(pred_raw)

                # Calculate accuracy metrics by comparing with actual next step
                accuracy_metrics = calculate_accuracy_metrics(grid, pred_grid)
                accuracy_scores.append(accuracy_metrics)

                # Update LSTM model with new data
                if len(grid_history) >= 2:
                    X_update = pred_data[-SEQUENCE_LENGTH:-1].reshape(1, SEQUENCE_LENGTH-1, -1)
                    y_update = pred_data[-1].reshape(1, GRID_SIZE, GRID_SIZE)
                    lstm_model.fit(X_update, y_update, epochs=5, verbose=0)

                # Display both grids with accuracy info
                plot_dual_grid(grid, pred_grid, step, step + 1, accuracy_metrics)
                plot_blurry_heatmap(cumulative_heat, step)
                save_heatmap(cumulative_heat, step)
            else:
                plot_grid(grid, step)
                plot_blurry_heatmap(cumulative_heat, step)
                save_heatmap(cumulative_heat, step)
        else:
            plot_grid(grid, step)
            plot_blurry_heatmap(cumulative_heat, step)
            save_heatmap(cumulative_heat, step)

# Finding the path and plotting it
path_finding(grid, start, goal)

print("Simulation completed!")
# Final accuracy summary
if len(accuracy_scores) > 0:
    print("\n" + "="*60)
    print("🎯 FINAL ACCURACY SUMMARY")
    print("="*60)

    all_overall = [s['overall'] for s in accuracy_scores]
    all_position = [s['position'] for s in accuracy_scores]
    all_clustering = [s['clustering'] for s in accuracy_scores]
    all_direction = [s['direction'] for s in accuracy_scores]

    print(f"📈 Overall Performance Metrics:")
    print(f"   Average Overall Grid Accuracy: {np.mean(all_overall):.2f}% (±{np.std(all_overall):.2f}%)")
    print(f"   Average People Position Accuracy: {np.mean(all_position):.2f}% (±{np.std(all_position):.2f}%)")
    print(f"   Average Clustering Pattern Accuracy: {np.mean(all_clustering):.2f}% (±{np.std(all_clustering):.2f}%)")
    print(f"   Average Movement Direction Accuracy: {np.mean(all_direction):.2f}% (±{np.std(all_direction):.2f}%)")

    print(f"\n📊 Best Performance:")
    print(f"   Best Overall Accuracy: {max(all_overall):.2f}%")
    print(f"   Best Position Accuracy: {max(all_position):.2f}%")
    print(f"   Best Clustering Accuracy: {max(all_clustering):.2f}%")

    print(f"\n🔄 Learning Progress:")
    if len(accuracy_scores) >= 10:
        early_avg = np.mean(all_overall[:5])
        late_avg = np.mean(all_overall[-5:])
        improvement = late_avg - early_avg
        print(f"   Early predictions (first 5): {early_avg:.2f}%")
        print(f"   Recent predictions (last 5): {late_avg:.2f}%")
        print(f"   Improvement: {improvement:+.2f}%")

    print(f"\n📋 Total predictions made: {len(accuracy_scores)}")
    print("="*60)