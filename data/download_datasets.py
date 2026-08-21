import os
import kagglehub
import subprocess

def download_datasets():
    print("Downloading Vitamin Deficiency Disease Prediction Dataset...")
    try:
        path1 = kagglehub.dataset_download("nudratabbas/vitamin-deficiency-disease-prediction-dataset")
        print("Path to dataset files:", path1)
    except Exception as e:
        print(f"Error downloading dataset 1: {e}")

    print("\nDownloading Pharmaceutical Drugs and Vitamins Dataset V2...")
    try:
        path2 = kagglehub.dataset_download("vencerlanz09/pharmaceutical-drugs-and-vitamins-dataset-v2")
        print("Path to dataset files:", path2)
    except Exception as e:
        print(f"Error downloading dataset 2: {e}")

    print("\nDownloading Drugs and Vitamins Classification Dataset...")
    try:
        path3 = kagglehub.dataset_download("utkarshsaxenadn/drugs-and-vitamins-classification")
        print("Path to dataset files:", path3)
    except Exception as e:
        print(f"Error downloading dataset 3: {e}")

    print("\nDownloading Supplement Sales Data...")
    try:
        path4 = kagglehub.dataset_download("zahidmughal2343/supplement-sales-data")
        print("Path to dataset files:", path4)
    except Exception as e:
        print(f"Error downloading dataset 4: {e}")

    print("\nAttempting to pull Kaggle Kernel (faulty-valdation-set-f1-score-97)...")
    try:
        # Check if Kaggle token exists (default Windows path)
        kaggle_token_path = os.path.expanduser('~/.kaggle/kaggle.json')
        if not os.path.exists(kaggle_token_path):
            print(f"Warning: kaggle.json not found at {kaggle_token_path}. Kaggle CLI requires authentication to pull kernels.")
            print("Please follow the instructions to set up your Kaggle API token.")
        
        # We run this using the installed kaggle CLI from the virtual environment
        result = subprocess.run(['kaggle', 'kernels', 'pull', 'gpiosenka/faulty-valdation-set-f1-score-97'], capture_output=True, text=True)
        if result.returncode == 0:
            print("Kernel pulled successfully!")
            print(result.stdout)
        else:
            print("Failed to pull kernel.")
            print(result.stderr)
            
    except Exception as e:
        print(f"Error pulling kernel: {e}")

if __name__ == "__main__":
    download_datasets()
