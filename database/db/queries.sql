USE campus_atlas;

-- 1. Select facilities (Non-archived printers in Main Library)
SELECT
  f.facilityID,
  b.build_name,
  c.category_name,
  f.floor,
  f.facility_status
FROM facilities AS f
JOIN buildings AS b ON b.buildingID = f.buildingID
JOIN categories AS c ON c.categoryID = f.categoryID
WHERE b.build_name = 'Main Library'
  AND c.category_name = 'Printer'
  AND f.archived = FALSE;

-- 2. Check pending reports
SELECT
  r.reportID,
  u.user_name,
  b.build_name,
  c.category_name,
  f.facility_status,
  r.proposed_status,
  r.review_status
FROM reports AS r
JOIN facilities AS f ON f.facilityID = r.facilityID
JOIN buildings AS b ON b.buildingID = f.buildingID
JOIN categories AS c ON c.categoryID = f.categoryID
JOIN users AS u ON u.userID = r.studentID
WHERE r.review_status = 'Pending';

-- 2b. Students (Student ID = 2) check for self submitted reports.
SELECT
  r.reportID,
  b.build_name,
  c.category_name,
  f.floor,
  r.proposed_status,
  r.review_status
FROM reports AS r
JOIN facilities AS f ON f.facilityID = r.facilityID
JOIN buildings AS b ON b.buildingID = f.buildingID
JOIN categories AS c ON c.categoryID = f.categoryID
WHERE r.studentID = 2;

-- 2c. Check for a certain facility type. (Facility: toilet, facility ID = 3)
SELECT
  v.revisionID,
  v.reportID,
  v.old_status,
  v.new_status,
  v.adminID
FROM revisions AS v
JOIN reports AS r ON r.reportID = v.reportID
WHERE r.facilityID = 3;

-- 3. Approve report (Report ID = 1, Admin ID = 4)
SET @facility_id = NULL;
SET @old_status = NULL;
SET @new_status = NULL;

START TRANSACTION;

SELECT
  r.facilityID,
  f.facility_status,
  r.proposed_status
INTO
  @facility_id,
  @old_status,
  @new_status
FROM reports AS r
JOIN facilities AS f ON f.facilityID = r.facilityID
WHERE r.reportID = 1
  AND r.review_status = 'Pending'
  AND EXISTS (SELECT 1 FROM admins WHERE userID = 4)
FOR UPDATE;

UPDATE reports
SET review_status = 'Approved',
    adminID = 4
WHERE reportID = 1
  AND review_status = 'Pending'
  AND EXISTS (SELECT 1 FROM admins WHERE userID = 4);

UPDATE facilities
SET facility_status = @new_status
WHERE facilityID = @facility_id
  AND @old_status IS NOT NULL;

INSERT INTO revisions (reportID, adminID, old_status, new_status)
SELECT 1, 4, @old_status, @new_status
FROM reports
WHERE reportID = 1
  AND review_status = 'Approved'
  AND @old_status IS NOT NULL
  AND EXISTS (SELECT 1 FROM admins WHERE userID = 4);

ROLLBACK;

-- 4. Reject report (Report ID = 2, Admin ID = 5)
START TRANSACTION;

UPDATE reports
SET review_status = 'Rejected',
    adminID = 5
WHERE reportID = 2
  AND review_status = 'Pending'
  AND EXISTS (SELECT 1 FROM admins WHERE userID = 5);

ROLLBACK;

-- 5. Student deletes pending report (Student ID = 1, Report ID = 1)
START TRANSACTION;

DELETE FROM reports
WHERE reportID = 1
  AND studentID = 1
  AND review_status = 'Pending';

ROLLBACK;

-- 6. Student Submit new report (Student ID = 1)
START TRANSACTION;

INSERT INTO reports (facilityID, studentID, adminID, proposed_status, review_status)
SELECT 2, 1, NULL, 'Unavailable', 'Pending'
FROM students
WHERE userID = 1;

ROLLBACK;

-- 7. Admin add new facility (Admin ID = 4)
START TRANSACTION;

INSERT INTO facilities (
  buildingID, categoryID, floor, facility_status
)
SELECT 26, 1, '2F', 'Available'
FROM admins
WHERE userID = 4;

ROLLBACK;

-- 8. Admin archive facility (Admin ID = 4, Facility ID = 2)
START TRANSACTION;

UPDATE facilities
SET archived = TRUE
WHERE facilityID = 2
  AND EXISTS (SELECT 1 FROM admins WHERE userID = 4);

ROLLBACK;
