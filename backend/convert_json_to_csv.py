# convert_json_to_csv.py
import json
import pandas as pd
import os

def convert_json_to_csv(json_file, csv_file):
    """
    Convert JSON file with project data to CSV format
    """
    # Read the JSON file
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Flatten nested object IDs if they exist
    if '_id' in df.columns and isinstance(df['_id'].iloc[0], dict):
        df['_id'] = df['_id'].apply(lambda x: x.get('$oid') if isinstance(x, dict) else x)
    
    if 'project_id' in df.columns and isinstance(df['project_id'].iloc[0], dict):
        df['project_id'] = df['project_id'].apply(lambda x: x.get('$numberLong') if isinstance(x, dict) else x)
    
    # Convert date fields
    date_columns = ['announce_date', 'transaction_date', 'contract_date']
    for col in date_columns:
        if col in df.columns:
            df[col] = df[col].apply(lambda x: x.get('$date') if isinstance(x, dict) else x)
            df[col] = pd.to_datetime(df[col])
            df[col] = df[col].dt.strftime('%Y-%m-%d')
    
    # Save to CSV
    df.to_csv(csv_file, index=False, encoding='utf-8')
    print(f"Successfully converted {json_file} to {csv_file}")
    
    # Print column names for reference
    print(f"Columns in the CSV: {', '.join(df.columns)}")

if __name__ == "__main__":
    # Paths
    json_file = "document_structure.json"
    csv_file = "projects_data.csv"
    
    # Check if JSON file exists
    if not os.path.exists(json_file):
        print(f"Error: {json_file} not found!")
    else:
        convert_json_to_csv(json_file, csv_file)
