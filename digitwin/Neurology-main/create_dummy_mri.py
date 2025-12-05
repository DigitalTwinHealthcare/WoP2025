import nibabel as nib
import numpy as np

def create_nifti(filename, volume_type):
    # Create a 3D matrix (128x128x128 cube)
    data = np.zeros((128, 128, 128), dtype=np.float32)
    
    # Create a "Brain" sphere in the middle
    # We adjust the radius to simulate atrophy
    # Radius 45 = ~380,000 voxels (Healthy)
    # Radius 30 = ~113,000 voxels (Severe Atrophy)
    
    radius = 45 if volume_type == "healthy" else 30
    
    center = [64, 64, 64]
    x, y, z = np.ogrid[:128, :128, :128]
    mask = (x - center[0])**2 + (y - center[1])**2 + (z - center[2])**2 <= radius**2
    data[mask] = 1.0 # Fill the sphere
    
    # Create NIfTI image
    # We set affine to identity matrix (1mm voxel size)
    img = nib.Nifti1Image(data, np.eye(4))
    
    # Save
    nib.save(img, filename)
    print(f"Created {filename} (Simulating {volume_type} brain)")

if __name__ == "__main__":
    create_nifti("patient_healthy.nii.gz", "healthy")
    create_nifti("patient_alzheimers.nii.gz", "severe")
