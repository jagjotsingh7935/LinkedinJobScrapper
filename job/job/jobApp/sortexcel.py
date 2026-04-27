import pandas as pd
from tkinter import Tk
from tkinter.filedialog import askopenfilename
from datetime import datetime

# Hide the tkinter root window
root = Tk()
root.withdraw()

print("Please select your Excel file (the one you want to sort correctly)")
file_path = askopenfilename(
    title="Select Job Applications Excel file",
    filetypes=[("Excel files", "*.xlsx *.xls"), ("All files", "*.*")]
)

if not file_path:
    print("No file selected. Exiting.")
    exit()

print(f"Selected: {file_path}")

# Read the Excel (first sheet)
df = pd.read_excel(file_path, sheet_name=0)

date_col = "Application Date"

if date_col not in df.columns:
    print(f"Column '{date_col}' not found.")
    print("Available columns:", list(df.columns))
    exit()

# Keep original date strings exactly as-is
df[date_col] = df[date_col].astype(str).str.strip()

# Function to parse dates for sorting only (tries common formats)
def parse_for_sort(date_str):
    if not date_str or date_str.lower() in ['nan', 'none', '']:
        return pd.NaT
    try:
        # Most common: MM/DD/YY, HH:MM [AM/PM]
        return datetime.strptime(date_str, "%m/%d/%y, %I:%M %p")
    except ValueError:
        pass
    try:
        # Without comma
        return datetime.strptime(date_str, "%m/%d/%y %I:%M %p")
    except ValueError:
        pass
    try:
        # Full year fallback
        return datetime.strptime(date_str, "%m/%d/%Y, %I:%M %p")
    except ValueError:
        return pd.NaT

# Create temp column for sorting only
df['sort_date'] = df[date_col].apply(parse_for_sort)

# Sort: oldest first, invalid/NaT at the very end
df_sorted = df.sort_values(by='sort_date', ascending=True, na_position='last')

# Remove the temporary sort column before saving
df_sorted = df_sorted.drop(columns=['sort_date'])

# Output filename
output_path = file_path.replace(".xlsx", "_sorted_oldest_to_newest.xlsx")

try:
    df_sorted.to_excel(
        output_path,
        index=False,
        engine='openpyxl'
    )
    print("\nSuccess! File correctly sorted (oldest at top, newest at bottom).")
    print(f"Saved as: {output_path}")
    print(f"Total rows: {len(df_sorted)}")
    
    # Optional: show first few and last few dates for quick check
    print("\nFirst 5 dates (should be oldest):")
    print(df_sorted[date_col].head(5).to_list())
    print("\nLast 5 dates (should be newest):")
    print(df_sorted[date_col].tail(5).to_list())
    
except Exception as e:
    print("Error saving:", e)
    print("Make sure openpyxl is installed: pip install openpyxl")