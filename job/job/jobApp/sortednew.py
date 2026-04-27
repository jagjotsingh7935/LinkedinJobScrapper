import pandas as pd
from tkinter import Tk
from tkinter.filedialog import askopenfilename
from tkinter.messagebox import showinfo, showerror

# Hide the main tkinter window
root = Tk()
root.withdraw()

# Open file selection dialog
file_path = askopenfilename(
    title="Select your Job_Activity_Sheet Excel file",
    filetypes=[("Excel files", "*.xlsx *.xls"), ("All files", "*.*")]
)

if not file_path:
    showerror("Cancelled", "No file selected. Exiting.")
    exit()

print(f"Selected file: {file_path}")

try:
    # Read all sheets
    excel_data = pd.read_excel(file_path, sheet_name=None, engine='openpyxl')

    if "Sheet3" not in excel_data:
        showerror("Error", "Sheet named 'Sheet3' not found in the file.")
        exit()

    df_sheet3 = excel_data["Sheet3"]

    date_column = "Applied Date"

    if date_column not in df_sheet3.columns:
        showerror("Error", f"Column '{date_column}' not found in Sheet3.")
        exit()

    # Parse dates (handles Excel serial numbers + text dates)
    def parse_date(val):
        if pd.isna(val):
            return pd.NaT
        # Excel serial date (numbers like 46000)
        if isinstance(val, (int, float)):
            try:
                return pd.to_datetime(val - 2, unit='d', origin='1899-12-30')
            except:
                pass
        # Text dates ("6 Sept 2025", "5 Nov 2025", etc.)
        try:
            return pd.to_datetime(val, errors='coerce', dayfirst=False)
        except:
            return pd.NaT

    df_sheet3[date_column] = df_sheet3[date_column].apply(parse_date)

    # Sort: oldest → newest, empty/invalid at bottom
    df_sheet3_sorted = df_sheet3.sort_values(
        by=date_column,
        ascending=True,
        na_position='last'
    )

    # Format to "5 Nov 2025" style (no leading zero, no time) – Windows-safe
    def format_date(dt):
        if pd.isna(dt):
            return ""           # blank for empty/invalid
        day = dt.day            # 5 (not 05)
        month_abbr = dt.strftime("%b")
        year = dt.year
        return f"{day} {month_abbr} {year}"

    df_sheet3_sorted[date_column] = df_sheet3_sorted[date_column].apply(format_date)

    # Update the sheet in memory
    excel_data["Sheet3"] = df_sheet3_sorted

    # Output file
    output_path = file_path.replace(".xlsx", "_Sheet3_sorted_oldest_to_newest.xlsx")

    # Save everything (Sheet1 & Sheet2 untouched)
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        for sheet_name, df in excel_data.items():
            df.to_excel(writer, sheet_name=sheet_name, index=False)

    showinfo(
        "Success",
        f"Sorting complete!\n\n"
        f"Only Sheet3 was sorted by '{date_column}' (oldest → newest).\n"
        f"Dates reformatted to 'd MMM YYYY' (e.g. 5 Nov 2025), no time.\n"
        f"Sheet1 and Sheet2 unchanged.\n\n"
        f"New file saved as:\n{output_path}"
    )

    print(f"Success! File saved to: {output_path}")

except Exception as e:
    showerror("Error", f"An error occurred:\n\n{str(e)}")
    print("Error details:", str(e))