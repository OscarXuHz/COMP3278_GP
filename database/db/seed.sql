USE campus_atlas;

INSERT INTO users (userID, user_name, email, user_password) VALUES
  (1, 'student1', 'student1@connect.hku.hk', 'student1'),
  (2, 'student2', 'student2@connect.hku.hk', 'student2'),
  (3, 'student3', 'student3@connect.hku.hk', 'student3'),
  (4, 'admin1', 'admin1@connect.hku.hk', 'admin1'),
  (5, 'admin2', 'admin2@connect.hku.hk', 'admin2');

INSERT INTO students (userID) VALUES
  (1),
  (2),
  (3);

INSERT INTO admins (userID) VALUES
  (4),
  (5);

INSERT INTO buildings (buildingID, build_name, campus) VALUES
  (1, 'Main Library', 'Main Campus'),
  (2, 'Chong Yuet Ming Amenities Centre', 'Main Campus'),
  (3, 'Chi Wah Learning Commons', 'Centennial Campus');

INSERT INTO categories (categoryID, category_name) VALUES
  (1, 'Printer'),
  (2, 'Water Dispenser'),
  (3, 'Toilet');

INSERT INTO facilities (
  facilityID, buildingID, categoryID, floor, latitude, longitude, facility_status
) VALUES
  (1, 1, 1, '1F', 22.283000, 114.137500, 'Available'),
  (2, 2, 2, '3F', 22.282300, 114.136100, 'Available'),
  (3, 3, 3, '2F', 22.283600, 114.134800, 'Unavailable');

INSERT INTO reports (
  reportID, facilityID, studentID, adminID, proposed_status, review_status
) VALUES
  (1, 1, 1, NULL, 'Unavailable', 'Pending'),
  (2, 2, 2, NULL, 'Unavailable', 'Pending'),
  (3, 3, 3, NULL, 'Available', 'Pending'),
  (4, 1, 2, 4, 'Available', 'Approved'),
  (5, 3, 3, 5, 'Unavailable', 'Approved');

INSERT INTO revisions (
  revisionID, reportID, adminID, old_status, new_status
) VALUES
  (1, 4, 4, 'Unavailable', 'Available'),
  (2, 5, 5, 'Available', 'Unavailable');
