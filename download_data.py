import os
import shutil
import kagglehub

def setup_dataset():
    target_dir = os.path.abspath("./data/fer2013")
    if os.path.exists(target_dir):
        print(f"Dataset already exists at: {target_dir}")
        return target_dir

    print("Downloading FER2013 dataset...")
    download_path = kagglehub.dataset_download("msambare/fer2013")
    print(f"Downloaded to cache: {download_path}")

    os.makedirs("./data", exist_ok=True)
    shutil.copytree(download_path, target_dir, dirs_exist_ok=True)
    print(f"Dataset ready at: {target_dir}")
    return target_dir

if __name__ == "__main__":
    setup_dataset()