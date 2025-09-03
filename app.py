from flask import Flask, render_template, request, redirect, url_for, session, flash, send_file, jsonify
from pymongo import MongoClient
import os
import base64
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from io import BytesIO
from datetime import datetime
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
import pandas as pd
from bson.objectid import ObjectId
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from reportlab.lib.utils import simpleSplit
from bson.errors import InvalidId
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user

app = Flask(__name__, static_folder='static')
app.secret_key = 'your_secret_key'

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, user_json):
        self.user_json = user_json
        self.id = str(user_json['_id'])
        self.username = user_json['username']
        self.role = user_json['role']

    def get_id(self):
        return self.id

@login_manager.user_loader
def load_user(user_id):
    u = users.find_one({"_id": ObjectId(user_id)})
    if not u:
        return None
    return User(u)

@app.route('/')
def home():
    return render_template('login.html')

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['annual_report_portal']
users = db['users']
achievements = db['academic_achievements']
activities_db = db['student_activities']
publications_db = db['research_publications']
alumni_achievements_db = db['alumni_achievements']
goals_db = db['future_goals']
feedback_db = db['feedback_comments']
submissions = db['submissions']
settings_collection = db['settings']
notifications_collection = db['notifications']
reports_collection=db["reports"]

departments = {
    "1": "CSE", "2": "IT", "3": "ECE", "4": "EEE",
    "5": "AIDS", "6": "AIML", "7": "CYS", "8": "BME",
    "9": "BT", "10": "FT", "11": "MECH", "12": "CIVIL", "13": "AGRI"
}
# Login route
# Login Route (For context)
@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('name')
    password = request.form.get('password')
    # Find the user with matching username and password
    user_doc = users.find_one({"username": username, "password": password})

    if user_doc:
        user_obj = User(user_doc)
        login_user(user_obj)

        # Redirect to the dashboard based on user role
        if current_user.role == 'admin':
            return redirect(url_for('admin_dashboard'))
        elif current_user.role == 'student':
            return redirect(url_for('student_dashboard'))
        elif current_user.role == 'staff':
            return redirect(url_for('staff_dashboard'))
    else:
        flash("Invalid credentials. Please try again.", "error")
        return redirect(url_for('home'))
    
    return render_template('login.html')
# Role-based routes
@app.route('/student')
@login_required
def student_dashboard():
    if current_user.role == 'student':
        return render_template('dashboard_viewer.html')
    else:
        flash("You are not authorized to view this page.", "error")
        return redirect(url_for('home'))

@app.route('/staff')
@login_required
def staff_dashboard():
    if current_user.role == 'staff':
        # Retrieve the updated deadline from session (if available)
        updated_deadline = session.get('updated_deadline', None)

        # Clear session after reading it to avoid showing the message repeatedly
        if updated_deadline:
            session.pop('updated_deadline')

        # Render the faculty dashboard template with the updated deadline message
        return render_template(
            'dashboard_faculty.html',
            updated_deadline=updated_deadline
        )
    else:
        flash("You are not authorized to view this page.", "error")
        return redirect(url_for('home'))


@app.route('/admin')
@login_required
def admin_dashboard():
    if current_user.role == 'admin':
        return render_template('dashboard_admin.html')
    else:
        flash("You are not authorized to view this page.", "error")
        return redirect(url_for('home'))

#logout
@app.route('/logout')
@login_required
def logout():
    logout_user()
    # Flash a logout success message
    flash("You have been logged out successfully.", "info")
    # Redirect to the login page
    return redirect(url_for('home'))

#add-user
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'pdf'}
# Ensure the uploads folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Helper function to check allowed file types
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/add-user', methods=['GET', 'POST'])
@login_required
def add_user():
    if current_user.role != 'admin':
        flash("You are not authorized to view this page.", "error")
        return redirect(url_for('home'))
    if request.method == 'POST':
        file = request.files.get('fileUpload')

        if file and allowed_file(file.filename):
            # Process uploaded file
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            print(f"File uploaded: {file_path}")  # Debug: file path

            try:
                # Process and store file data
                processed_users = []
                
                # Handle CSV or Excel file
                if filename.endswith('.csv') or filename.endswith(('.xlsx', '.xls')):
                    data = pd.read_csv(file_path) if filename.endswith('.csv') else pd.read_excel(file_path)
                    print(f"File content: {data.head()}")  # Debug: print file content
                    
                    for _, row in data.iterrows():
                        username = row.get('Username')
                        password = row.get('Password')
                        roll_no = row.get('Roll Number', '')
                        department = row.get('Department', '')
                        role = row.get('Role', '')

                        if username and password:
                            user_data = {
                                "username": username,
                                "password": password,
                                "roll_no": roll_no,
                                "department": department,
                                "role": role,
                            }
                            # Debug: print data being inserted
                            print(f"Inserting user: {user_data}")
                            if not users.find_one({"username": username}):  # Avoid duplicates
                                insert_result = users.insert_one(user_data)
                                processed_users.append(username)
                            else:
                                print(f"Duplicate skipped: {username}")
                
                # Handle PDF file (similar logic to CSV/Excel)
                elif filename.endswith('.pdf'):
                    reader = PdfReader(file_path)
                    print(f"Reading PDF content")  # Debug: PDF processing
                    for page in reader.pages:
                        lines = page.extract_text().split('\n')
                        for line in lines:
                            parts = line.split(',')
                            if len(parts) >= 5:  # Validate structure
                                username, password, roll_no, department, role = parts[:5]
                                if username and password:
                                    user_data = {
                                        "username": username,
                                        "password": password,
                                        "roll_no": roll_no,
                                        "department": department,
                                        "role": role,
                                    }
                                    print(f"Inserting user from PDF: {user_data}")  # Debug: PDF user data
                                    if not users.find_one({"username": username}):
                                        insert_result = users.insert_one(user_data)
                                        processed_users.append(username)
                                    else:
                                        print(f"Duplicate skipped: {username}")

                flash(f"{len(processed_users)} users added successfully from file!", "success")
            except Exception as e:
                flash(f"An error occurred while processing the file: {str(e)}", "error")
                print(f"Error processing file: {str(e)}")  # Debug: Error message
            finally:
                os.remove(file_path)
        else:
            # Process form data if no file is uploaded (existing logic remains the same)
            email = request.form.get('email')
            password = request.form.get('password')
            roll_no = request.form.get('rollNo')
            department = request.form.get('year')
            role = request.form.get('role')

            if email and password:
                user_data = {
                    "username": email,
                    "password": password,
                    "roll_no": roll_no,
                    "department": department,
                    "role": role,
                }
                # Debug: print data being inserted manually
                print(f"Inserting user manually: {user_data}")
                if not users.find_one({"username": email}):
                    insert_result = users.insert_one(user_data)
                    print(f"Inserted user with ID: {insert_result.inserted_id}")  # Debug: manual insert ID
                    flash("User added successfully!", "success")
                else:
                    flash("User already exists!", "error")
            else:
                flash("Please fill all the required fields!", "error")

        return redirect(url_for('add_user'))

    return render_template('add-user.html')
#remove-user
@app.route('/remove_user', methods=['GET', 'POST'])
@login_required
def remove_user():
    if current_user.role != 'admin':
        flash("You are not authorized to view this page.", "error")
        return redirect(url_for('home'))
    if request.method == 'POST':
        # Retrieve form data
        email = request.form.get('email')

        # Check if email is provided
        if not email:
            flash("Please provide an email address.", "error")
            return redirect(url_for('remove_user'))

        # Attempt to delete the user with the provided email
        result = users.delete_one({"username": email})

        # Check if deletion was successful
        if result.deleted_count > 0:
            flash("User removed successfully.", "success")
        else:
            flash("No matching user found. Please check the details.", "error")

        # Redirect back to the remove-user page
        return redirect(url_for('remove_user'))

    # Render the Remove User page
    return render_template('remove-user.html')


#approve data
from bson import ObjectId
from bson.errors import InvalidId
# Convert ObjectId to string
def convert_objectid_to_str(submissions):
    for submission in submissions:
        submission['_id'] = str(submission['_id'])  # Convert ObjectId to string
    return submissions

@app.route('/approve-data')
@login_required
def approve_data():
    if current_user.role != 'admin':
        flash("You are not authorized to view this page.", "error")
        return redirect(url_for('home'))
    # Fetch all pending data from all collections
    pending_submissions = {
        "Academic Achievements": list(db['academic_achievements'].find({"status": "pending"})),
        "Student Activities": list(db['student_activities'].find({"status": "pending"})),
        "Research Publications": list(db['research_publications'].find({"status": "pending"})),
        "Alumni Achievements": list(db['alumni_achievements'].find({"status": "pending"})),
        "Future Goals": list(db['future_goals'].find({"status": "pending"})),
        "Feedback": list(db['feedback_comments'].find({"status": "pending"}))
    }

    # Convert ObjectId to string for rendering
    pending_submissions = {
        category: convert_objectid_to_str(submissions) for category, submissions in pending_submissions.items()
    }
    # Return the data to the template for rendering on the page
    return render_template('approve-data.html', pending_submissions=pending_submissions)

@app.route('/approve/<category>/<submission_id>')
@login_required
def approve_submission(category, submission_id):
    if current_user.role != 'admin':
        flash("You are not authorized to perform this action.", "error")
        return redirect(url_for('home'))
    try:
        # Validate and convert the submission ID to ObjectId
        obj_id = ObjectId(submission_id)
        
        # Correct category mapping
        collection_map = {
            'Academic Achievements': ('academic_achievements', 'Academic Achievements'),
            'Student Activities': ('student_activities', 'Student Activities'),
            'Research Publications': ('research_publications', 'Research and Publication'),
            'Alumni Achievements': ('alumni_achievements', 'Alumni Achievement'),
            'Future Goals': ('future_goals', 'Future Goals & Department Plans'),
            'Feedback': ('feedback_comments', 'Feedback')
        }

        # Check if the category is valid
        if category not in collection_map:
            flash("Invalid category.", "error")
            return redirect(url_for('approve_data'))

        # Get the correct collection and category value
        collection_name, db_category = collection_map[category]
        collection = db[collection_name]

        # Query for a pending submission with the correct category and status
        pending_submission = collection.find_one({'_id': obj_id, 'status': 'pending', 'category': db_category})

        if not pending_submission:
            flash(f"No pending submission found for {category}.", "warning")
            return redirect(url_for('approve_data'))

        # Approve the submission
        result = collection.update_one(
            {'_id': obj_id, 'status': 'pending', 'category': db_category},
            {'$set': {'status': 'approved'}}
        )

        # Check if the submission was successfully approved
        if result.modified_count > 0:
            flash(f"{category} submission approved successfully!", "success")
        else:
            flash(f"{category} submission not found or already approved.", "warning")

    except Exception as e:
        # Handle any unexpected errors
        flash(f"Error approving {category} submission: {e}", "error")
        return redirect(url_for('approve_data'))

    return redirect(url_for('approve_data'))



@app.route('/reject/<category>/<submission_id>')
@login_required
def reject_submission(category, submission_id):
    if current_user.role != 'admin':
        flash("You are not authorized to perform this action.", "error")
        return redirect(url_for('home'))
    try:
        # Validate ObjectId
        try:
            obj_id = ObjectId(submission_id)
        except InvalidId:
            flash("Invalid Submission ID.", "error")
            return redirect(url_for('approve_data'))

        # Define collection mapping
        collection_map = {
            'Academic Achievements': 'academic_achievements',
            'Student Activities': 'student_activities',
            'Research Publications': 'research_publications',
            'Alumni Achievements': 'alumni_achievements',
            'Future Goals': 'future_goals',
            'Feedback': 'feedback_comments'
        }

        if category not in collection_map:
            flash("Invalid category.", "error")
            return redirect(url_for('approve_data'))

        # Reject the submission in the correct collection
        collection = db[collection_map[category]]
        result = collection.update_one(
            {'_id': obj_id},
            {'$set': {'status': 'rejected'}}
        )

        if result.modified_count > 0:
            flash(f"{category} submission rejected successfully!", "success")
        else:
            flash(f"{category} submission not found or already rejected.", "warning")
    except Exception as e:
        flash(f"Error rejecting {category} submission: {e}", "error")

    return redirect(url_for('approve_data'))



#view-reports
@app.route('/view-report', methods=['GET'])
@login_required
def view_report():
    # Fetch data from MongoDB collections where the status is 'approved'
    academic_achievements = db['academic_achievements'].find({"status": "approved"})
    feedbacks = db['feedback_comments'].find({"status": "approved"})
    student_activities = db['student_activities'].find({"status": "approved"})
    research_publications = db['research_publications'].find({"status": "approved"})
    alumni_achievements = db['alumni_achievements'].find({"status": "approved"})
    future_goals = db['future_goals'].find({"status": "approved"})

    # Convert MongoDB cursor objects to lists for easier template rendering
    academic_achievements = list(academic_achievements)
    feedbacks = list(feedbacks)
    student_activities = list(student_activities)
    research_publications = list(research_publications)
    alumni_achievements = list(alumni_achievements)
    future_goals = list(future_goals)

    return render_template(
        'view-report.html',
        academic_achievements=academic_achievements,
        feedbacks=feedbacks,
        student_activities=student_activities,
        research_publications=research_publications,
        alumni_achievements=alumni_achievements,
        future_goals=future_goals
    )


#generate-reports
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit

@app.route('/generate-reports', methods=['GET', 'POST'])
@login_required
def generate_reports():
    if current_user.role != 'admin':
        flash("You are not authorized to perform this action.", "error")
        return redirect(url_for('home'))
    if request.method == 'POST':
        category = request.form.get('category')
        year_str = request.form.get('year')
        department = request.form.get('department')
        if not category or not year_str:
            flash("Category and year are required", "error")
            return redirect(url_for('generate_reports'))

        try:
            year = int(year_str)
        except (ValueError, TypeError):
            flash("Invalid year format. Please enter a valid year.", "error")
            return redirect(url_for('generate_reports'))

        try:
            collection_name = category
            query = {"status": "approved"}
            if department != "all":
                query['department'] = department

            if collection_name == 'academic_achievements':
                query['$expr'] = {'$eq': [{'$year': '$date'}, year]}
            elif collection_name == 'research_publications':
                query['$expr'] = {
                    '$eq': [
                        {
                            '$year': {
                                '$cond': {
                                    'if': {'$isDate': '$publication_date'},
                                    'then': '$publication_date',
                                    'else': {'$toDate': '$publication_date'}
                                }
                            }
                        },
                        year
                    ]
                }
            else:
                query['year'] = year

            if collection_name not in db.list_collection_names():
                flash(f"Invalid category '{collection_name}'. No matching collection found.", "error")
                return redirect(url_for('generate_reports'))

            data_cursor = db[collection_name].find(query)
            data_list = list(data_cursor)

            if not data_list:
                flash("No approved records found for the selected criteria.", "info")
                return redirect(url_for('generate_reports'))
        except Exception as e:
            flash(f"Error during query: {e}", "error")
            return redirect(url_for('generate_reports'))

        # Create PDF
        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=letter)
        pdf.setTitle(f"{category.replace('_', ' ').title()} Report - {year}")

        # Add Title and Date
        pdf.setFont("Helvetica-Bold", 20)
        pdf.drawString(200, 750, f"{category.replace('_', ' ').title()} Report ({year})")
        pdf.setFont("Helvetica", 12)
        pdf.drawString(50, 730, f"Generated on: {datetime.now().strftime('%Y-%m-%d')}")

        y_position = 700  # Start position for content
        max_width = 500   # Max text width for wrapping
        pdf.setFont("Helvetica", 12)

        # Add Data to the PDF
        for record in data_list:
            if y_position < 100:  # Start a new page if content exceeds the page
                pdf.showPage()
                y_position = 750

            # Loop through fields and display as subheading + paragraph
            for field, value in record.items():
                if field != '_id':  # Skip _id field
                    field_name = field.replace('_', ' ').title()
                    field_value = str(value).replace('■■', '')  # Clean unwanted characters

                    # Add field name
                    pdf.setFont("Helvetica-Bold", 12)
                    pdf.drawString(50, y_position, f"{field_name}:")
                    y_position -= 15

                    # Add field value with wrapping
                    pdf.setFont("Helvetica", 10)
                    wrapped_text = simpleSplit(field_value, "Helvetica", 10, max_width)
                    for line in wrapped_text:
                        if y_position < 50:  # Ensure space before adding new text
                            pdf.showPage()
                            y_position = 750
                        pdf.drawString(50, y_position, line)
                        y_position -= 15

                    y_position -= 20  # Space between fields

        pdf.save()
        buffer.seek(0)

        # Store PDF in MongoDB
        try:
            report_entry = {
                "category": category,
                "year": year,
                "department": department,
                "generated_on": datetime.now(),
                "content": buffer.getvalue()
            }
            db["reports"].insert_one(report_entry)
        except Exception as e:
            flash(f"Error saving report: {e}", "error")
            return redirect(url_for('generate_reports'))

        flash("Report generated successfully!", "success")
        return redirect(url_for('generate_reports'))

    return render_template('generate-report.html')



# Route to download the report
@app.route('/download_report', methods=['GET', 'POST'])
@login_required
def download_report():
    if request.method == 'GET':
        # Render the form for selecting report criteria
        return render_template('download_report.html')

    if request.method == 'POST':
        try:
            # Retrieve filtering criteria from the form
            category = request.form.get('category')
            year = request.form.get('year')
            department = request.form.get('department')

            # Query MongoDB for the report
            query = {
                "year": year,
                "department": department,
                "category": category
            }
            report = reports_collection.find_one(query)

            if not report or 'content' not in report:
                flash("No report found for the given criteria!", "error")
                return redirect(url_for('download_report'))

            # Stream the report content as a file download
            report_stream = BytesIO(report['content'])
            report_stream.seek(0)
            filename = f"{category}{year}{department}_report.pdf"

            return send_file(
                report_stream,
                as_attachment=True,
                download_name=filename,
                mimetype='application/pdf'
            )
        except Exception as e:
            # Handle exceptions
            app.logger.error(f"Error during report download: {e}")
            flash("An error occurred while fetching the report.", "error")
            return redirect(url_for('download_report'))
reports_collection = db["reports"]

@app.route('/download-pdf-form', methods=['POST'])
@login_required
def download_pdf_form():
    try:
        # Get form data
        category = request.form.get('category')
        year = request.form.get('year')
        department = request.form.get('department')

        # Query MongoDB for the matching report
        query = {
            "category": category,
            "year": int(year),
            "department": department
        }
        report = reports_collection.find_one(query)

        # If report not found or content missing, handle the error
        if not report or 'content' not in report:
            flash("No report found for the given criteria.", "error")
            return redirect('/download_report')

        # Decode the Base64-encoded content to binary
        report_content = base64.b64decode(report['content']['$binary']['base64'])

        # Stream the report content as a file download
        report_stream = BytesIO(report_content)
        filename = f"{category}{year}{department}_report.pdf"

        return send_file(
            report_stream,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )

    except Exception as e:
        # Log the error and flash an error message
        app.logger.error(f"Error during report download: {e}")
        flash("An error occurred while processing your request. Please try again later.", "error")
        return redirect('/download_report')

@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    if current_user.role != 'admin':
        flash("You are not authorized to perform this action.", "error")
        return redirect(url_for('home'))
    if request.method == 'POST':
        # Get form data
        deadline = request.form.get('deadline')

        # Validate input
        if not deadline:
            flash("All fields are required.", "error")
            return redirect(url_for('settings'))

        # Update settings in the database
        settings_collection.update_one(
            {},  # You can specify filter criteria if needed
            {"$set": {"submission_deadline": deadline}},  # No report_visibility here
            upsert=True
        )

        # Store the updated deadline in the session
        session['updated_deadline'] = deadline

        flash("Settings updated successfully.", "success")
        return redirect(url_for('settings'))

    # Handle GET request
    settings = settings_collection.find_one()
    faculty_count = users.count_documents({"role": "staff"})
    student_count = users.count_documents({"role": "student"})
    
    return render_template(
        'update-settings.html',
        faculty_count=faculty_count,
        student_count=student_count,
        deadline=settings.get('submission_deadline', '') if settings else ''
    )



#forms
@app.route('/academic-achievements', methods=['GET', 'POST'])
@login_required
def academic_achievements():
    if request.method == 'POST':
        # Extracting form data
        title = request.form.get('title')
        description = request.form.get('description')
        department = request.form.get('department')
        year = request.form.get('year')
        date = request.form.get('date')
        visibility = request.form.get('visibility')
        category = "Academic Achievements"
        status = "pending"
        
        # Get the username of the logged-in staff from the session
        username = current_user.username  # Use session variable

        # Handling file upload
        file = request.files.get('supporting_document')
        file_name = None
        if file and file.filename != '':
            file_name = file.filename
            upload_folder = os.path.join('uploads')
            os.makedirs(upload_folder, exist_ok=True)
            file.save(os.path.join(upload_folder, file_name))

        # Create a document to insert into the MongoDB
        achievement_data = {
            'username' : username,
            'category': category,
            'title': title,
            'description': description,
            'department': department,
            
            'date': datetime.strptime(date, '%Y-%m-%d'),
            'visibility': visibility,
            'status': status,
            'file_name': file_name,
            'submitted_at': datetime.now(),
            'submitted_by': username  # Add username here
        }

        # Insert into the academic_achievements collection
        try:
            achievements.insert_one(achievement_data)
            flash('Achievement submitted successfully!', 'success')

            # Create a notification for admin
            notifications = db['notifications']
            notification = {
                'user_name': username,  # Include the staff username here
                'category': category,
                'description': f"New academic achievement submitted by {department}.",
                'timestamp': datetime.now(),
                'status': 'unread'
            }
            notifications.insert_one(notification)

        except Exception as e:
            flash(f'Error submitting achievement: {e}', 'danger')

        return redirect(url_for('academic_achievements'))

    return render_template('form1.html')

@app.route('/student-activities', methods=['GET', 'POST'])
@login_required
def student_activities():
    if request.method == 'POST':
        try:
            username = current_user.username  # Add username from session
            
            # Collect form data
            event_title = request.form.get('title')
            description = request.form.get('description')
            date_time = request.form.get('date_time')
            year = request.form.get('year')
            department = request.form.get('department')
            category = request.form.get('category', 'Student Activities')
            status = request.form.get('status', 'pending')

            # Handle file upload
            poster = request.files.get('poster')
            poster_path = None
            if poster and poster.filename:
                upload_folder = 'uploads'
                os.makedirs(upload_folder, exist_ok=True)
                poster_path = os.path.join(upload_folder, poster.filename)
                poster.save(poster_path)

            # Save data to MongoDB
            student_activity = {
                'username': username,  # Add username to the data
                'event_title': event_title,
                'description': description,
                'date_time': date_time,
                'year': year,
                'department': department,
                'category': category,
                'status': status,
                'poster_path': poster_path,
                'submitted_at': datetime.now()
            }
            db['student_activities'].insert_one(student_activity)

            flash('Student activity submitted successfully!', 'success')
            return redirect(url_for('student_activities'))

        except Exception as e:
            print(f"Error: {e}")
            flash('Error submitting student activity', 'error')
            return redirect(url_for('student_activities'))

    # For GET requests, retrieve activities with usernames
    activities = list(db['student_activities'].find())
    return render_template('form2.html', activities=activities)


@app.route('/research-publication', methods=['GET', 'POST'])
@login_required
def research_publication():
    if request.method == 'POST':
        try:
            username = current_user.username  # Add username from session
            
            # Collect form data
            publication_date_str = request.form.get('publicationDate')
            publication_date = None
            if publication_date_str:
                try:
                    publication_date = datetime.strptime(publication_date_str, '%Y-%m-%d')
                except ValueError:
                    flash('Invalid date format for Publication Date. Please use YYYY-MM-DD.', 'error')
                    return redirect(url_for('research_publication'))

            research_data = {
                'username': username,  # Add username to the data
                'research_title': request.form.get('researchTitle'),
                'author_name': request.form.get('authorName'),
                'publication_year': request.form.get('publicationYear'),
                'department': request.form.get('department'),
                'publication_date': publication_date,
                'research_summary': request.form.get('researchSummary'),
                'category': request.form.get('category'),
                'status': request.form.get('status', 'pending'),
                'submitted_at': datetime.now()
            }
            db['research_publications'].insert_one(research_data)

            flash('Research publication submitted successfully!', 'success')
            return redirect(url_for('research_publication'))

        except Exception as e:
            print(f"Error: {e}")
            flash('Error submitting research publication', 'error')
            return redirect(url_for('research_publication'))

    publications = list(db['research_publications'].find())
    return render_template('form3.html', publications=publications)


 # Check the form data received

@app.route('/alumni-achievement', methods=['GET', 'POST'])
@login_required
def alumni_achievement():
    if request.method == 'POST':
        try:
            username = current_user.username  # Add username from session
            
            # Collect form data
            alumni_data = {
                'username': username,  # Add username to the data
                'alumni_name': request.form.get('alumniName'),
                'graduation_year': int(request.form.get('graduationYear')),
                'achievement_title': request.form.get('achievementTitle'),
                'achievement_details': request.form.get('achievementDetails'),
                'year': int(request.form.get('year')),
                'department': request.form.get('department'),
                'category': request.form.get('category'),
                'status': request.form.get('status', 'pending'),
                'submitted_at': datetime.now()
            }
            db['alumni_achievements'].insert_one(alumni_data)

            flash('Alumni achievement submitted successfully!', 'success')
            return redirect(url_for('alumni_achievement'))

        except Exception as e:
            print(f"Error: {e}")
            flash('Error submitting alumni achievement', 'error')
            return redirect(url_for('alumni_achievement'))

    achievements = list(db['alumni_achievements'].find())
    return render_template('form4.html', achievements=achievements)

@app.route('/future-goals', methods=['GET', 'POST'])
@login_required
def future_goals():
    if request.method == 'POST':
        try:
            # Retrieve username from session
            username = current_user.username

            # Collect form data
            department_name = request.form.get('departmentName')
            goal_title = request.form.get('goalTitle')
            goal_description = request.form.get('goalDescription')
            target_date = request.form.get('targetDate')
            year = request.form.get('year')
            department = request.form.get('department')  # This should be the department field
            category = "Future Goals & Department Plans"  # Hidden field, predefined category
            status = "pending"  # Data is pending approval

            # Save data in a "pending" state
            goal_data = {
                'username': username,  # Add the logged-in username
                'department_name': department_name,
                'goal_title': goal_title,
                'goal_description': goal_description,
                'target_date': target_date,
                'year': year,
                'department': department,  # department field should now be correctly captured
                'category': category,
                'status': status  # Mark as pending
            }

            # Insert into MongoDB future_goals collection
            db['future_goals'].insert_one(goal_data)

            flash('Future goal submitted successfully and is pending approval!', 'success')
            return redirect(url_for('future_goals'))

        except Exception as e:
            print(f"Error: {e}")
            flash('Error submitting future goal', 'error')
            return redirect(url_for('future_goals'))

    # Retrieve submitted goals to display (showing only pending ones)
    goals = db['future_goals'].find()
    return render_template('form5.html', goals=goals)


@app.route('/feedback', methods=['GET', 'POST'])
@login_required
def feedback():
    if request.method == 'POST':
        try:
            # Collect form data
            user_name = current_user.username
            feedback_text = request.form.get('feedback')

            # Save data to MongoDB
            feedback_data = {
                'user_name': user_name,
                'feedback': feedback_text,
                'submitted_by': user_name,
                'status': 'pending'
            }
            db['feedback_comments'].insert_one(feedback_data)

            flash('Thank you for your feedback!', 'success')
            return redirect(url_for('feedback'))

        except Exception as e:
            print(f"Error: {e}")
            flash('Error submitting feedback', 'error')
            return redirect(url_for('feedback'))

    # Retrieve submitted feedback to display
    feedbacks = db['feedback_comments'].find()
    return render_template('form6.html', feedbacks=feedbacks)

#submission
@app.route('/submit_achievement', methods=['GET', 'POST'])
@login_required
def submit_achievement():
    if request.method == 'POST':
        # Assuming you have user authentication, and the current user is the staff member submitting
        faculty_name = current_user.username  # Replace with the actual field from your user model
        category = request.form.get('category')  # Category of the submission

        # Create a notification object
        notification = {
            'user_name': faculty_name,
            'category': category,
            'timestamp': datetime.now()
        }

        # Insert the notification into the MongoDB 'notifications' collection
        try:
            notifications_collection.insert_one(notification)
            flash('Notification inserted successfully!', 'success')  # Flash success message
        except Exception as e:
            flash(f'Error inserting notification: {e}', 'danger')  # Flash error message if something goes wrong

        # After inserting, redirect to the admin notifications page
        return redirect(url_for('admin_notifications'))

    return render_template('faculty_related_form.html')

@app.route('/update_settings', methods=['GET', 'POST'])
@login_required
def update_settings():
    if current_user.role != 'admin':
        flash("You are not authorized to perform this action.", "error")
        return redirect(url_for('home'))
    if request.method == 'POST':
        # Get form data for the deadline, report visibility, and category
        deadline = request.form.get('deadline')
        report_visibility = request.form.get('report_visibility')
        category = request.form.get('category')  # New field for category
        
        # Update settings in the MongoDB collection (annual report settings)
        result = settings_collection.update_one(
            {"name": "annual_report"},  # Assuming a settings document is identified by "name"
            {"$set": {"deadline": deadline, "category": category}}, 
            upsert=True  
        )
        
        if result.matched_count > 0:
            flash('Settings updated successfully!', 'success')
        else:
            flash('Failed to update settings. Please try again.', 'danger')
        
        return redirect(url_for('update_settings'))

    # Fetch faculty and student counts from the "users" collection
    faculty_count = db.users.count_documents({"role": "staff"})  # Assuming "role" field identifies faculty
    student_count = db.users.count_documents({"role": "student"})  # Assuming "role" field identifies students
    
    # Fetch current settings from MongoDB (if they exist)
    settings = settings_collection.find_one({"name": "annual_report"})
    if settings:
        deadline = settings.get('deadline', '2024-12-31')  # Default value if not set
        category = settings.get('category', 'academic_achievements')  # Default category if not set
    else:
        deadline = '2024-12-31'
        category = 'academic_achievements'

    return render_template('update-settings.html', 
                           faculty_count=faculty_count, 
                           student_count=student_count, 
                           deadline=deadline, 
                           category=category)

@app.route('/notifications_admin', methods=['GET'])
@login_required
def notifications_admin():
    if current_user.role != 'admin':
        flash("You are not authorized to perform this action.", "error")
        return redirect(url_for('home'))
    # Fetch notifications for the admin, sorted by timestamp (latest first)
    notifications = notifications_collection.find().sort("timestamp", -1)
    notifications_list = []

    for notification in notifications:
        notifications_list.append({
            "_id": str(notification["_id"]),
            "user_name": notification.get("user_name"),
            "category": notification.get("category"),
            "submitted_data": notification.get("submitted_data"),
            "timestamp": notification.get("timestamp"),
            "status": notification.get("status", "pending"),  # default status "pending"
        })

    return render_template("notifications_admin.html", notifications=notifications_list)

@app.route('/clear_all_notifications', methods=['POST'])
@login_required
def clear_all_notifications():
    if current_user.role != 'admin':
        return jsonify({"message": "Unauthorized action!"}), 403
    # Deletes all notifications from the collection
    notifications_collection.delete_many({})
    return jsonify({"message": "All notifications cleared successfully!"}), 200

@app.route('/get_notifications')
@login_required
def get_notifications():
    # Fetch the latest notifications
    notifications = notifications_collection.find().sort('timestamp', -1)
    notification_list = []
    for notification in notifications:
        notification_list.append({
            'user_name': notification['user_name'],
            'category': notification['category'],
            'timestamp': notification['timestamp']
        })
    
    return jsonify({'notifications': notification_list})




@app.route('/edit-submission', methods=['GET'])
@login_required
def edit_submission():
    role = current_user.role
    username = current_user.username

    if role == 'admin':
        # Admin sees all approved submissions
        academic_achievements = db['academic_achievements'].find({"status": "approved"})
        feedbacks = db['feedback_comments'].find({"status": "approved"})
        student_activities = db['student_activities'].find({"status": "approved"})
        research_publications = db['research_publications'].find({"status": "approved"})
        alumni_achievements = db['alumni_achievements'].find({"status": "approved"})
        future_goals = db['future_goals'].find({"status": "approved"})
    else:
        # Faculty sees only their submissions, regardless of status
        academic_achievements = db['academic_achievements'].find({"submitted_by": username})
        feedbacks = db['feedback_comments'].find({"submitted_by": username})
        student_activities = db['student_activities'].find({"submitted_by": username})
        research_publications = db['research_publications'].find({"submitted_by": username})
        alumni_achievements = db['alumni_achievements'].find({"submitted_by": username})
        future_goals = db['future_goals'].find({"submitted_by": username})

    # Convert MongoDB cursor objects to lists for easier template rendering
    return render_template(
        'edit_submission.html',
        academic_achievements=list(academic_achievements),
        feedbacks=list(feedbacks),
        student_activities=list(student_activities),
        research_publications=list(research_publications),
        alumni_achievements=list(alumni_achievements),
        future_goals=list(future_goals),
        role=role
    )

@app.route('/edit/<collection>/<record_id>', methods=['GET'])
@login_required
def edit_record(collection, record_id):
    role = current_user.role
    username = current_user.username

    # Fetch the record
    record = db[collection].find_one({"_id": ObjectId(record_id)})

    if not record:
        return jsonify({"error": "Record not found"}), 404

    # Ensure faculty can only edit their own records
    if role != 'admin' and record.get('submitted_by') != username:
        return jsonify({"error": "Unauthorized action."}), 403

    return render_template('edit_form.html', record=record, collection=collection)

@app.route('/update_submission', methods=['POST'])
@login_required
def update_submission():
    role = current_user.role
    username = current_user.username

    collection_name = request.form.get('collection')
    record_id = request.form.get('id')
    updated_data = request.form.to_dict()

    updated_data.pop('collection', None)
    updated_data.pop('id', None)

    # Check permissions
    if role != 'admin':
        record = db[collection_name].find_one({"_id": ObjectId(record_id)})
        if not record or record.get('submitted_by') != username:
            return jsonify({'error': 'Unauthorized action.'}), 403

    # Update the record
    result = db[collection_name].update_one(
        {"_id": ObjectId(record_id)},
        {"$set": updated_data}
    )

    if result.modified_count > 0:
        return redirect(url_for('edit_submission'))
    else:
        return jsonify({'error': 'Update failed. Please try again.'}), 400




if __name__ == "__main__":
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    app.run(debug=True,port=5000)