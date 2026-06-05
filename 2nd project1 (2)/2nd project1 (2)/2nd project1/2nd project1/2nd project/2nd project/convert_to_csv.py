
import json
import csv
import os

def convert_json_to_csv():
    json_path = r'c:\Users\jagru\Downloads\2nd project1\2nd project1\2nd project\2nd project\backend\data\courses_dataset.json'
    csv_path = r'c:\Users\jagru\Downloads\2nd project1\2nd project1\2nd project\2nd project\backend\data\courses_dataset.csv'
    
    if not os.path.exists(json_path):
        print(f"Error: {json_path} not found.")
        return

    with open(json_path, 'r') as f:
        data = json.load(f)

    headers = ['ID', 'Course Name', 'Category', 'Description', 'Module Name', 'Topic']
    
    rows = []
    for course in data:
        course_id = course.get('id', '')
        course_name = course.get('name', '')
        category = course.get('category', '')
        description = course.get('description', '')
        
        for module in course.get('modules', []):
            module_name = module.get('name', '')
            for topic in module.get('topics', []):
                rows.append([
                    course_id,
                    course_name,
                    category,
                    description,
                    module_name,
                    topic
                ])

    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(headers)
        writer.writerows(rows)
    
    print(f"Successfully created CSV at: {csv_path}")

if __name__ == "__main__":
    convert_json_to_csv()
