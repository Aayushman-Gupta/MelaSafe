import numpy as np
import cv2
import os
import matplotlib.pyplot as plt
from scipy.ndimage import gaussian_filter
from sklearn.cluster import DBSCAN
from shapely.geometry import Point, Polygon
from scipy.spatial import Voronoi, voronoi_plot_2d


def load_heatmap(image_path):
    img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError(f"Could not load image at {image_path}")
    return img.astype(float)


def extract_cluster_regions(heatmap, eps=10, min_samples=20):
    points = np.column_stack(np.nonzero(heatmap > heatmap.mean()))
    if len(points) == 0:
        return []
    db = DBSCAN(eps=eps, min_samples=min_samples).fit(points)
    labels = db.labels_
    regions = []
    for label in set(labels):
        if label == -1:
            continue
        cluster_points = points[labels == label]
        regions.append(cluster_points)
    return regions


from scipy.ndimage import binary_dilation, binary_erosion

def density_aware_border_placement(heatmap, regions, num_ambulances, r_min=30):
    placed = []
    candidates = []

    for region in regions:
        mask = np.zeros_like(heatmap, dtype=bool)
        for y, x in region:
            mask[int(y), int(x)] = True

        border = binary_dilation(mask) & ~binary_erosion(mask)
        border_coords = np.column_stack(np.nonzero(border))

        # Filter border points by density
        for y, x in border_coords:
            if heatmap[y, x] > np.percentile(heatmap, 60):
                candidates.append((y, x, heatmap[y, x]))

    # Sort by density descending
    candidates = sorted(candidates, key=lambda tup: -tup[2])

    for y, x, _ in candidates:
        if len(placed) >= num_ambulances:
            break
        allow = True
        for py, px in placed:
            if np.linalg.norm([y - py, x - px]) < r_min:
                allow = False
                break
        if allow:
            placed.append((y, x))

    # Fallback with looser spacing if not enough placed
    if len(placed) < num_ambulances:
        for y, x, _ in candidates:
            if len(placed) >= num_ambulances:
                break
            allow = True
            for py, px in placed:
                if np.linalg.norm([y - py, x - px]) < r_min / 2:
                    allow = False
                    break
            if allow:
                placed.append((y, x))

    return np.array(placed)

def allocate_resources(heatmap, ambulance_positions):
    if len(ambulance_positions) < 4:
        return np.ones(len(ambulance_positions)), ambulance_positions

    vor = Voronoi(ambulance_positions)
    cell_densities = []
    valid_positions = []

    from matplotlib.path import Path

    def points_in_polygon(shape, polygon):
        h, w = shape
        y, x = np.mgrid[:h, :w]
        points = np.column_stack((x.ravel(), y.ravel()))
        path = Path(polygon)
        mask = path.contains_points(points)
        return mask.reshape(shape)

    for i, region_idx in enumerate(vor.point_region):
        vertices = vor.regions[region_idx]
        if -1 not in vertices and len(vertices) > 0:
            polygon = [vor.vertices[v] for v in vertices]
            mask = points_in_polygon(heatmap.shape, polygon)
            cell_density = heatmap[mask].sum()
            cell_densities.append(cell_density)
            valid_positions.append(ambulance_positions[i])

    if not cell_densities:
        return np.ones(len(ambulance_positions)), ambulance_positions

    resources = (np.array(cell_densities) / max(cell_densities)) * 9 + 1
    return resources, np.array(valid_positions)


def visualize_placement(heatmap, positions, resources, save_path=None):
    plt.figure(figsize=(12, 8))
    plt.imshow(heatmap, cmap='hot', alpha=0.7)

    if len(positions) >= 4:
        vor = Voronoi(positions)
        voronoi_plot_2d(vor, ax=plt.gca(), show_points=False, line_colors='white')

    plt.scatter(
        positions[:, 1], positions[:, 0],
        s=resources*100, c='blue', edgecolors='white', label='Ambulance'
    )

    for i, (y, x) in enumerate(positions):
        plt.text(x, y, f"{resources[i]:.1f}", ha='center', va='center', color='white', weight='bold')

    plt.colorbar(label='Crowd Density')
    plt.title("Emergency Service Placement\n(Circle size = Resource allocation)")
    plt.legend()
    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
    plt.close()


def process_single_heatmap(heatmap_path, output_dir, num_ambulances=5):
    heatmap = load_heatmap(heatmap_path)
    heatmap = gaussian_filter(heatmap, sigma=2)

    regions = extract_cluster_regions(heatmap)
    if not regions:
        return None

    positions = density_aware_border_placement(heatmap, regions, num_ambulances)
    resources, valid_positions = allocate_resources(heatmap, positions)

    os.makedirs(output_dir, exist_ok=True)
    base_name = os.path.splitext(os.path.basename(heatmap_path))[0]
    output_path = os.path.join(output_dir, f"{base_name}_placement.png")
    visualize_placement(heatmap, valid_positions, resources, save_path=output_path)

    return {
        'heatmap': heatmap_path,
        'positions': valid_positions.tolist(),
        'resources': resources.tolist(),
        'visualization': output_path
    }


def process_heatmap_folder(folder_path, output_dir, num_ambulances=5):
    os.makedirs(output_dir, exist_ok=True)
    results = []
    for filename in sorted(os.listdir(folder_path)):
        if filename.endswith('.png'):
            heatmap_path = os.path.join(folder_path, filename)
            result = process_single_heatmap(heatmap_path, output_dir, num_ambulances)
            if result:
                results.append(result)
    return results


if __name__ == "__main__":
    folder_path = "heatmaps"  # Replace with your actual folder path
    output_dir = "output_placements"
    results = process_heatmap_folder(folder_path, output_dir, num_ambulances=30)
    for result in results:
        print(f"Processed {result['heatmap']}")
        print(f"Ambulance positions: {result['positions']}")
        print(f"Resource allocations: {result['resources']}")
        print(f"Visualization saved to: {result['visualization']}")
        print("---------------------------")