import pandas as pd
import json
import re
import math

# --- Configuration ---
# This configuration now exactly matches the columns from your CSV file.
CSV_FILES_CONFIG = {
    'fec': {
        'filename': 'fec_reviews.csv',
        'columns': {
            'id': 'FEC Number',
            'name': 'FEC Name',
            'rating': 'On a scale of 1 to 10, how likely will you suggest your fellow friend to opt for this FEC in the next semester?',
            'teacher': "What was your Teacher's Name?",
            'review': 'Please write a small review of your FEC',
            # Corrected column name to match your file exactly, including the emoji.
            'study_time': 'How much study time is required to score good in your FEC?PS- Haan wahi Paper se ek raat Pehle wala🤡'
        }
    }
}

OUTPUT_FILENAME = 'courses_advanced.json'

# --- Advanced Scoring & Tagging Logic ---
CHILL_SCORE_KEYWORDS = {
    'positive': ['chill', 'easy', 'no stress', 'no exam', 'no paper', 'presentation', 'kam padna', 'last day', 'ek raat', '0 hours', '1-2 hours', 'no assignment'],
    'negative': ['strict', 'hectic', 'daily', 'compulsory', '75%', 'gaand maregi', 'trash', 'bakchod', 'sir dard']
}

TRAP_COURSE_KEYWORDS = ['avoid', 'trash', 'bekar', 'zero marks', 'ganda', 'devil', 'bakchod']

def calculate_chill_score(reviews):
    """Calculates a 'Chill Score' from 0 to 10 based on keywords."""
    if not reviews:
        return 5 # Default score

    score = 5
    for review in reviews:
        text = (review.get('review', '') + ' ' + review.get('study_time', '')).lower()
        
        for keyword in CHILL_SCORE_KEYWORDS['positive']:
            if keyword in text:
                score += 0.5
        
        for keyword in CHILL_SCORE_KEYWORDS['negative']:
            if keyword in text:
                score -= 1
    
    return max(0, min(10, round(score, 1))) # Clamp score between 0 and 10

def is_trap_course(avg_rating, reviews):
    """Flags a course as a 'trap' if it has a low rating and negative keywords."""
    if avg_rating >= 6.0:
        return False
        
    all_review_text = ' '.join([r.get('review', '').lower() for r in reviews])
    
    for keyword in TRAP_COURSE_KEYWORDS:
        if keyword in all_review_text:
            return True
            
    return False

def process_csv(filepath, course_type, columns_map, courses_dict):
    """Reads a CSV, processes rows, and groups reviews by teacher."""
    try:
        # The 'skiprows' parameter has been REMOVED to read from the first line.
        df = pd.read_csv(filepath)
    except FileNotFoundError:
        print(f"Error: File not found at '{filepath}'.")
        print("Please make sure 'fec_reviews.csv' is in the same folder as this script.")
        return

    print(f"Processing {filepath}...")

    for _, row in df.iterrows():
        try:
            # Handle potential empty strings for course_id before converting to int
            id_val = row[columns_map['id']]
            if pd.isna(id_val) or str(id_val).strip() == '':
                continue
            course_id = int(float(id_val))

            course_name = str(row[columns_map['name']]).strip()
            
            if not course_name or pd.isna(course_name) or course_name.lower() == 'nan':
                continue

            rating_str = str(row[columns_map['rating']]).strip()
            rating = int(float(rating_str)) if rating_str.replace('.', '', 1).isdigit() else None
            
            # Normalize teacher name to handle variations
            teacher_name = str(row.get(columns_map['teacher'], 'Unknown')).strip().title()
            if not teacher_name or teacher_name.lower() == 'nan':
                teacher_name = 'Unknown'

            review_obj = {
                'rating': rating,
                'review': str(row.get(columns_map['review'], '')).strip(),
                'study_time': str(row.get(columns_map['study_time'], '')).strip()
            }

            unique_key = f"{course_type.upper()}-{course_id}"

            if unique_key not in courses_dict:
                courses_dict[unique_key] = {
                    'id': course_id,
                    'type': course_type.upper(),
                    'name': course_name,
                    'teachers': {}
                }
            
            if teacher_name not in courses_dict[unique_key]['teachers']:
                courses_dict[unique_key]['teachers'][teacher_name] = {'reviews': []}
            
            if rating is not None:
                courses_dict[unique_key]['teachers'][teacher_name]['reviews'].append(review_obj)

        except (ValueError, KeyError) as e:
            # This will catch errors like non-integer course IDs or missing columns
            # print(f"Skipping a row due to data error: {e}")
            continue

def main():
    """Main function to orchestrate the advanced data processing."""
    courses_processed = {}

    # Process each configured CSV file (now only FEC)
    for course_type, config in CSV_FILES_CONFIG.items():
        process_csv(config['filename'], course_type, config['columns'], courses_processed)

    final_course_list = []
    for course_data in courses_processed.values():
        all_reviews_flat = []
        
        # Calculate per-teacher stats
        for teacher, data in course_data['teachers'].items():
            ratings = [r['rating'] for r in data['reviews'] if r['rating'] is not None]
            data['avg_rating'] = round(sum(ratings) / len(ratings), 2) if ratings else 0
            all_reviews_flat.extend(data['reviews'])

        # Calculate overall course stats
        overall_ratings = [r['rating'] for r in all_reviews_flat if r['rating'] is not None]
        course_data['avg_rating'] = round(sum(overall_ratings) / len(overall_ratings), 2) if overall_ratings else 0
        
        # Calculate advanced scores
        course_data['chill_score'] = calculate_chill_score(all_reviews_flat)
        course_data['is_trap_course'] = is_trap_course(course_data['avg_rating'], all_reviews_flat)
        course_data['review_count'] = len(all_reviews_flat)

        if course_data['review_count'] > 0:
            final_course_list.append(course_data)

    final_course_list.sort(key=lambda x: x['avg_rating'], reverse=True)

    with open(OUTPUT_FILENAME, 'w', encoding='utf-8') as f:
        json.dump(final_course_list, f, indent=4, ensure_ascii=False)

    print(f"\nProcessing complete!")
    print(f"Successfully processed {len(final_course_list)} unique courses.")
    print(f"Output saved to '{OUTPUT_FILENAME}'.")


if __name__ == '__main__':
    main()
