import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import heapq
from collections import defaultdict
import math

class PathfindingSystem:
    def __init__(self, grid_size):
        self.grid_size = grid_size
        self.directions = [(-1,0), (1,0), (0,-1), (0,1), (-1,-1), (-1,1), (1,-1), (1,1)]  # 8-directional
        self.diagonal_cost = math.sqrt(2)
        
    def calculate_density_grid(self, grid, influence_radius=3):
        """Calculate density grid based on current people positions"""
        density_grid = np.ones((self.grid_size, self.grid_size), dtype=float)
        
        # Find all people positions
        people_positions = np.where(grid == 1)
        people_coords = list(zip(people_positions[0], people_positions[1]))
        
        # Calculate density influence for each cell
        for x in range(self.grid_size):
            for y in range(self.grid_size):
                if grid[x, y] == -1:  # Obstacle
                    density_grid[x, y] = -1
                    continue
                
                density_value = 1.0  # Base cost
                
                # Add influence from nearby people
                for px, py in people_coords:
                    distance = math.sqrt((x - px)**2 + (y - py)**2)
                    if distance <= influence_radius:
                        # Higher density cost for areas with more people
                        influence = max(0, (influence_radius - distance) / influence_radius)
                        density_value += influence * 3  # Multiply by 3 for stronger avoidance
                
                density_grid[x, y] = min(density_value, 12)  # Cap at 12
        
        return density_grid
    
    def heuristic(self, a, b):
        """Euclidean distance heuristic"""
        return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)
    
    def get_movement_cost(self, current, next_pos, density_grid):
        """Calculate movement cost including density and distance"""
        # Base movement cost (1 for straight, sqrt(2) for diagonal)
        dx = abs(next_pos[0] - current[0])
        dy = abs(next_pos[1] - current[1])
        base_cost = self.diagonal_cost if (dx == 1 and dy == 1) else 1.0
        
        # Density cost (higher density = higher cost)
        density_cost = density_grid[next_pos[0], next_pos[1]]
        
        # Total cost combines movement and density
        total_cost = base_cost * density_cost
        
        return total_cost
    
    def is_valid_position(self, pos, grid):
        """Check if position is valid (within bounds and not an obstacle)"""
        x, y = pos
        return (0 <= x < self.grid_size and 
                0 <= y < self.grid_size and 
                grid[x, y] != -1)
    
    def find_path_astar(self, start, goal, grid, density_grid=None):
        """
        A* pathfinding algorithm with density avoidance
        
        Args:
            start: (x, y) starting position
            goal: (x, y) goal position
            grid: 2D grid with obstacles (-1), empty (0), people (1)
            density_grid: Optional pre-calculated density grid
            
        Returns:
            path: List of (x, y) coordinates from start to goal
            cost: Total path cost
            explored: Set of explored positions (for visualization)
        """
        
        if density_grid is None:
            density_grid = self.calculate_density_grid(grid)
        
        # Validate start and goal positions
        if not self.is_valid_position(start, grid):
            print(f"Invalid start position: {start}")
            return [], float('inf'), set()
        
        if not self.is_valid_position(goal, grid):
            print(f"Invalid goal position: {goal}")
            return [], float('inf'), set()
        
        # A* algorithm implementation
        open_set = [(0, start)]  # Priority queue: (f_score, position)
        came_from = {}
        g_score = defaultdict(lambda: float('inf'))
        g_score[start] = 0
        f_score = defaultdict(lambda: float('inf'))
        f_score[start] = self.heuristic(start, goal)
        explored = set()
        
        while open_set:
            current_f, current = heapq.heappop(open_set)
            
            if current in explored:
                continue
                
            explored.add(current)
            
            # Goal reached
            if current == goal:
                path = []
                while current in came_from:
                    path.append(current)
                    current = came_from[current]
                path.append(start)
                path.reverse()
                return path, g_score[goal], explored
            
            # Explore neighbors
            for dx, dy in self.directions:
                neighbor = (current[0] + dx, current[1] + dy)
                
                if not self.is_valid_position(neighbor, grid):
                    continue
                
                if neighbor in explored:
                    continue
                
                # Calculate tentative g_score
                tentative_g = g_score[current] + self.get_movement_cost(current, neighbor, density_grid)
                
                if tentative_g < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g
                    f_score[neighbor] = tentative_g + self.heuristic(neighbor, goal)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))
        
        # No path found
        return [], float('inf'), explored
    
    def find_multiple_paths(self, start, goal, grid, num_paths=3):
        """
        Find multiple alternative paths using different strategies
        
        Returns:
            paths: List of path dictionaries with 'path', 'cost', and 'strategy' keys
        """
        density_grid = self.calculate_density_grid(grid)
        paths = []
        
        # Strategy 1: Standard A* with density avoidance
        path1, cost1, explored1 = self.find_path_astar(start, goal, grid, density_grid)
        if path1:
            paths.append({
                'path': path1,
                'cost': cost1,
                'strategy': 'Density Avoiding',
                'explored': explored1
            })
        
        # Strategy 2: Prefer edges (lower density cost near boundaries)
        edge_density = np.copy(density_grid)
        for x in range(self.grid_size):
            for y in range(self.grid_size):
                if edge_density[x, y] != -1:  # Not an obstacle
                    # Reduce cost near edges
                    distance_to_edge = min(x, y, self.grid_size-1-x, self.grid_size-1-y)
                    if distance_to_edge <= 2:
                        edge_density[x, y] *= 0.7  # 30% cost reduction near edges
        
        path2, cost2, explored2 = self.find_path_astar(start, goal, grid, edge_density)
        if path2 and path2 != path1:
            paths.append({
                'path': path2,
                'cost': cost2,
                'strategy': 'Edge Preferring',
                'explored': explored2
            })
        
        # Strategy 3: Straight line preference (reduce diagonal penalty)
        straight_density = np.copy(density_grid)
        self.diagonal_cost = 1.1  # Reduce diagonal penalty
        path3, cost3, explored3 = self.find_path_astar(start, goal, grid, straight_density)
        self.diagonal_cost = math.sqrt(2)  # Reset
        
        if path3 and path3 not in [p['path'] for p in paths]:
            paths.append({
                'path': path3,
                'cost': cost3,
                'strategy': 'Direct Route',
                'explored': explored3
            })
        
        return paths
    
    def smooth_path(self, path, grid):
        """
        Smooth path by removing unnecessary waypoints
        """
        if len(path) <= 2:
            return path
        
        smoothed = [path[0]]
        i = 0
        
        while i < len(path) - 1:
            # Try to skip ahead as far as possible
            for j in range(len(path) - 1, i, -1):
                if self.has_clear_line_of_sight(path[i], path[j], grid):
                    smoothed.append(path[j])
                    i = j
                    break
            else:
                i += 1
                if i < len(path):
                    smoothed.append(path[i])
        
        return smoothed
    
    def has_clear_line_of_sight(self, start, end, grid):
        """
        Check if there's a clear line of sight between two points
        """
        x0, y0 = start
        x1, y1 = end
        
        # Bresenham's line algorithm
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        
        x, y = x0, y0
        x_inc = 1 if x1 > x0 else -1
        y_inc = 1 if y1 > y0 else -1
        
        error = dx - dy
        
        while True:
            if not self.is_valid_position((x, y), grid):
                return False
            
            if x == x1 and y == y1:
                break
            
            e2 = 2 * error
            if e2 > -dy:
                error -= dy
                x += x_inc
            if e2 < dx:
                error += dx
                y += y_inc
        
        return True

def plot_pathfinding_results(grid, density_grid, paths_data, step, start=None, goal=None):
    """
    Enhanced plotting function that shows grid, density, and multiple paths
    """
    fig, axes = plt.subplots(1, 3, figsize=(18, 6))
    
    # Plot 1: Original grid with people and obstacles
    ax5 = axes[0]
    cmap_grid = ListedColormap(['white', 'blue', 'black'])  # empty, people, obstacles
    display_grid = np.copy(grid)
    display_grid[display_grid == -1] = 2
    ax5.imshow(display_grid, cmap=cmap_grid)
    ax5.set_title(f"Grid State - Step {step}")
    ax5.axis('off')
    
    # Plot 2: Density heatmap
    ax6 = axes[1]
    display_density = np.copy(density_grid)
    display_density[display_density == -1] = 15  # Special value for obstacles
    ax6.imshow(display_density, cmap='hot', interpolation='bilinear', vmin=1, vmax=12)
    ax6.set_title(f"Density Map - Step {step}")
    ax6.axis('off')
    
    # Plot 3: Paths overlay
    ax7 = axes[2]
    # Start with density as background
    ax7.imshow(display_density, cmap='hot', interpolation='bilinear', vmin=1, vmax=12, alpha=0.6)
    
    # Draw paths with different colors
    colors = ['lime', 'cyan', 'yellow', 'magenta']
    for i, path_data in enumerate(paths_data):
        path = path_data['path']
        if path:
            path_array = np.array(path)
            ax7.plot(path_array[:, 1], path_array[:, 0], 
                    color=colors[i % len(colors)], linewidth=3, 
                    label=f"{path_data['strategy']} (Cost: {path_data['cost']:.1f})",
                    marker='o', markersize=2)
    
    # Mark start and goal
    if start:
        ax7.plot(start[1], start[0], 'go', markersize=10, label='Start')
    if goal:
        ax7.plot(goal[1], goal[0], 'ro', markersize=10, label='Goal')
    
    ax7.set_title("Pathfinding Results")
    ax7.axis('off')
    ax7.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    
    plt.tight_layout()
    plt.show()
