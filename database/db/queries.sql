USE campus_atlas;

-- 1. Select facilities (Non-archived printers in Main Library)
SELECT
  f.facilityID,
  b.build_name,
  c.category_name,
  f.floor,
  f.facility_note,
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
  r.review_status,
  GROUP_CONCAT(p.photo ORDER BY p.photo SEPARATOR ', ') AS photos
FROM reports AS r
JOIN facilities AS f ON f.facilityID = r.facilityID
JOIN buildings AS b ON b.buildingID = f.buildingID
JOIN categories AS c ON c.categoryID = f.categoryID
JOIN users AS u ON u.userID = r.studentID
LEFT JOIN report_photos AS p ON p.reportID = r.reportID
WHERE r.review_status = 'Pending'
GROUP BY
  r.reportID,
  u.user_name,
  b.build_name,
  c.category_name,
  f.facility_status,
  r.proposed_status,
  r.review_status;

-- 2b. Students (Student ID = 2) check for self submitted reports.
SELECT
  r.reportID,
  b.build_name,
  c.category_name,
  f.floor,
  f.facility_note,
  r.proposed_status,
  r.review_status,
  GROUP_CONCAT(p.photo ORDER BY p.photo SEPARATOR ', ') AS photos
FROM reports AS r
JOIN facilities AS f ON f.facilityID = r.facilityID
JOIN buildings AS b ON b.buildingID = f.buildingID
JOIN categories AS c ON c.categoryID = f.categoryID
LEFT JOIN report_photos AS p ON p.reportID = r.reportID
WHERE r.studentID = 2
GROUP BY
  r.reportID,
  b.build_name,
  c.category_name,
  f.floor,
  f.facility_note,
  r.proposed_status,
  r.review_status;

-- 2c. Check for a certain facility type. (Facility: toilet, facility ID = 3)
SELECT
  v.revisionID,
  v.reportID,
  v.old_status,
  v.new_status,
  v.adminID
FROM revisions AS v
WHERE v.facilityID = 3;

-- 2d. Expired reports. adminID, review_note, and review_time stay empty.
SELECT
  r.reportID,
  u.user_name,
  b.build_name,
  c.category_name,
  f.floor,
  f.facility_note,
  r.proposed_status,
  r.review_status,
  r.adminID,
  r.review_time,
  r.report_create_time
FROM reports AS r
JOIN facilities AS f ON f.facilityID = r.facilityID
JOIN buildings AS b ON b.buildingID = f.buildingID
JOIN categories AS c ON c.categoryID = f.categoryID
JOIN users AS u ON u.userID = r.studentID
WHERE r.review_status = 'Expired'
ORDER BY r.report_create_time;

-- 3. Approve report (Report ID = 10, Admin ID = 4)
-- Earlier pending reports on the same facility expire. Later ones stay pending.
SET @facility_id = NULL;
SET @old_status = NULL;
SET @new_status = NULL;
SET @review_time = '2026-11-19 16:00:00';

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
WHERE r.reportID = 10
  AND r.review_status = 'Pending'
  AND EXISTS (SELECT 1 FROM admins WHERE userID = 4)
FOR UPDATE;

UPDATE reports
SET review_status = 'Approved',
    adminID = 4,
    review_note = 'Still out of paper',
    review_time = @review_time
WHERE reportID = 10
  AND review_status = 'Pending'
  AND EXISTS (SELECT 1 FROM admins WHERE userID = 4);

UPDATE reports AS earlier
JOIN reports AS approved ON approved.reportID = 10
SET earlier.review_status = 'Expired'
WHERE earlier.facilityID = approved.facilityID
  AND earlier.reportID <> approved.reportID
  AND earlier.review_status = 'Pending'
  AND earlier.report_create_time < approved.report_create_time
  AND approved.review_status = 'Approved'
  AND approved.adminID = 4;

UPDATE facilities
SET facility_status = @new_status
WHERE facilityID = @facility_id
  AND @old_status IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM reports
    WHERE reportID = 10
      AND review_status = 'Approved'
      AND adminID = 4
  );

INSERT INTO revisions (
  facilityID, reportID, adminID, old_status, new_status, revision_create_time
)
SELECT @facility_id, 10, 4, @old_status, @new_status, @review_time
FROM reports
WHERE reportID = 10
  AND review_status = 'Approved'
  AND adminID = 4
  AND @old_status IS NOT NULL;

INSERT INTO notifications (notification_create_time)
SELECT @review_time
FROM reports
WHERE reportID = 10
  AND review_status = 'Approved'
  AND adminID = 4;

INSERT INTO review_notifications (notificationID, reportID, studentID, review_is_read)
SELECT LAST_INSERT_ID(), reportID, studentID, FALSE
FROM reports
WHERE reportID = 10
  AND review_status = 'Approved'
  AND adminID = 4;

ROLLBACK;

-- 4. Reject report (Report ID = 2, Admin ID = 5)
-- Rejection does not expire earlier pending reports.
SET @review_time = '2026-11-20 09:00:00';

START TRANSACTION;

UPDATE reports
SET review_status = 'Rejected',
    adminID = 5,
    review_note = 'Dispenser was refilled this morning',
    review_time = @review_time
WHERE reportID = 2
  AND review_status = 'Pending'
  AND EXISTS (SELECT 1 FROM admins WHERE userID = 5);

INSERT INTO notifications (notification_create_time)
SELECT @review_time
FROM reports
WHERE reportID = 2
  AND review_status = 'Rejected'
  AND adminID = 5;

INSERT INTO review_notifications (notificationID, reportID, studentID, review_is_read)
SELECT LAST_INSERT_ID(), reportID, studentID, FALSE
FROM reports
WHERE reportID = 2
  AND review_status = 'Rejected'
  AND adminID = 5;

ROLLBACK;

-- 5. Student deletes a pending report (Student ID = 8, Report ID = 9)
-- Remove photos, likes, and the admins' new-report notices before the report.
START TRANSACTION;

DELETE p
FROM report_photos AS p
JOIN reports AS r ON r.reportID = p.reportID
WHERE r.reportID = 9
  AND r.studentID = 8
  AND r.review_status = 'Pending';

DELETE l
FROM likes AS l
JOIN reports AS r ON r.reportID = l.reportID
WHERE r.reportID = 9
  AND r.studentID = 8
  AND r.review_status = 'Pending';

DELETE nn
FROM new_notifications AS nn
JOIN reports AS r ON r.reportID = nn.reportID
WHERE r.reportID = 9
  AND r.studentID = 8
  AND r.review_status = 'Pending';

DELETE n
FROM notifications AS n
LEFT JOIN new_notifications AS nn ON nn.notificationID = n.notificationID
LEFT JOIN review_notifications AS rn ON rn.notificationID = n.notificationID
WHERE nn.notificationID IS NULL
  AND rn.notificationID IS NULL;

DELETE FROM reports
WHERE reportID = 9
  AND studentID = 8
  AND review_status = 'Pending';

ROLLBACK;

-- 6. Student submits a new report (Student ID = 1, Facility ID = 69)
-- Also store a photo and notify every admin.
START TRANSACTION;

INSERT INTO reports (
  facilityID, studentID, adminID, proposed_status, review_status, create_note
)
SELECT 69, 1, NULL, 'Unavailable', 'Pending', 'The dispenser by the Jockey Club Tower lift has stopped dispensing water'
FROM students
WHERE userID = 1
  AND EXISTS (
    SELECT 1
    FROM facilities
    WHERE facilityID = 69
      AND archived = FALSE
  );

SET @report_id = LAST_INSERT_ID();
SET @notice_time = '2026-11-21 09:00:00';

INSERT INTO report_photos (reportID, photo)
SELECT r.reportID, 'ric-cpd-jockey-club.jpg'
FROM reports AS r
WHERE r.reportID = @report_id
  AND r.studentID = 1
  AND r.review_status = 'Pending';

INSERT INTO notifications (notification_create_time)
SELECT @notice_time
FROM admins AS a
WHERE EXISTS (
  SELECT 1
  FROM reports AS r
  WHERE r.reportID = @report_id
    AND r.studentID = 1
    AND r.review_status = 'Pending'
);

INSERT INTO new_notifications (notificationID, reportID, adminID, new_is_read)
SELECT paired.notificationID, @report_id, paired.userID, FALSE
FROM (
  SELECT n.notificationID, a.userID
  FROM (
    SELECT
      notificationID,
      ROW_NUMBER() OVER (ORDER BY notificationID) AS rn
    FROM notifications
    WHERE notification_create_time = @notice_time
  ) AS n
  JOIN (
    SELECT userID, ROW_NUMBER() OVER (ORDER BY userID) AS rn
    FROM admins
  ) AS a ON a.rn = n.rn
) AS paired
WHERE EXISTS (
  SELECT 1
  FROM reports AS r
  WHERE r.reportID = @report_id
    AND r.studentID = 1
    AND r.review_status = 'Pending'
);

ROLLBACK;

-- 7. Admin add new facility (Admin ID = 4)
START TRANSACTION;

INSERT INTO facilities (
  buildingID, categoryID, floor, facility_note, facility_status
)
SELECT '26', 1, '2/F', 'Beside the help desk', 'Available'
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

-- 9. Facility history: approved reports and direct admin edits (Facility ID = 25)
SELECT
  v.revisionID,
  v.revision_create_time,
  v.old_status,
  v.new_status,
  admin_user.user_name AS admin_name,
  v.reportID,
  student_user.user_name AS student_name
FROM revisions AS v
JOIN users AS admin_user ON admin_user.userID = v.adminID
LEFT JOIN reports AS r ON r.reportID = v.reportID
LEFT JOIN users AS student_user ON student_user.userID = r.studentID
WHERE v.facilityID = 25
ORDER BY v.revision_create_time;

-- 10. Photos stored for reports
SELECT
  reportID,
  photo
FROM report_photos
ORDER BY reportID, photo;

-- 11. Like count for each report
SELECT
  r.reportID,
  r.review_status,
  COUNT(l.studentID) AS like_count
FROM reports AS r
LEFT JOIN likes AS l ON l.reportID = r.reportID
GROUP BY r.reportID, r.review_status
ORDER BY like_count DESC, r.reportID;

-- 12. Facilities favorited by a student (Student ID = 1)
SELECT
  f.facilityID,
  b.build_name,
  c.category_name,
  f.floor,
  f.facility_note,
  f.facility_status
FROM favorites AS fav
JOIN facilities AS f ON f.facilityID = fav.facilityID
JOIN buildings AS b ON b.buildingID = f.buildingID
JOIN categories AS c ON c.categoryID = f.categoryID
WHERE fav.studentID = 1;

-- 13. Unread new-report notifications for an admin (Admin ID = 5)
SELECT
  n.notificationID,
  n.notification_create_time,
  nn.reportID,
  u.user_name AS student_name,
  r.proposed_status,
  r.review_status
FROM new_notifications AS nn
JOIN notifications AS n ON n.notificationID = nn.notificationID
JOIN reports AS r ON r.reportID = nn.reportID
JOIN users AS u ON u.userID = r.studentID
WHERE nn.adminID = 5
  AND nn.new_is_read = FALSE
ORDER BY n.notification_create_time;

-- 14. Review notifications for a student (Student ID = 2)
SELECT
  n.notificationID,
  n.notification_create_time,
  rn.reportID,
  r.review_status,
  r.review_note,
  rn.review_is_read
FROM review_notifications AS rn
JOIN notifications AS n ON n.notificationID = rn.notificationID
JOIN reports AS r ON r.reportID = rn.reportID
WHERE rn.studentID = 2
ORDER BY n.notification_create_time;

-- 15. Admin changes facility status directly (Admin ID = 4, Facility ID = 20)
-- Earlier pending reports on this facility expire. Later ones stay pending.
SET @change_time = '2026-11-20 10:00:00';

START TRANSACTION;

INSERT INTO revisions (
  facilityID, reportID, adminID, old_status, new_status, revision_create_time
)
SELECT f.facilityID, NULL, 4, f.facility_status, 'Unavailable', @change_time
FROM facilities AS f
WHERE f.facilityID = 20
  AND f.facility_status <> 'Unavailable'
  AND EXISTS (SELECT 1 FROM admins WHERE userID = 4);

UPDATE facilities
SET facility_status = 'Unavailable'
WHERE facilityID = 20
  AND EXISTS (SELECT 1 FROM admins WHERE userID = 4);

UPDATE reports
SET review_status = 'Expired'
WHERE facilityID = 20
  AND review_status = 'Pending'
  AND report_create_time < @change_time
  AND EXISTS (
    SELECT 1
    FROM revisions
    WHERE facilityID = 20
      AND reportID IS NULL
      AND adminID = 4
      AND revision_create_time = @change_time
  );

ROLLBACK;

-- 16. Non-archived facilities for the campus map
SELECT
  f.facilityID,
  b.buildingID,
  b.build_name,
  b.campus,
  b.map_x,
  b.map_y,
  c.category_name,
  f.floor,
  f.facility_note,
  f.facility_status
FROM facilities AS f
JOIN buildings AS b ON b.buildingID = f.buildingID
JOIN categories AS c ON c.categoryID = f.categoryID
WHERE f.archived = FALSE
ORDER BY b.campus, b.buildingID, f.floor, f.facilityID;

-- 17. Archived facilities
SELECT
  f.facilityID,
  b.buildingID,
  b.build_name,
  c.category_name,
  f.floor,
  f.facility_note,
  f.facility_status
FROM facilities AS f
JOIN buildings AS b ON b.buildingID = f.buildingID
JOIN categories AS c ON c.categoryID = f.categoryID
WHERE f.archived = TRUE
ORDER BY b.buildingID, f.facilityID;

-- 18. Admin marks a new-report notification read (Admin ID = 5, Notification ID = 4)
START TRANSACTION;

UPDATE new_notifications
SET new_is_read = TRUE
WHERE notificationID = 4
  AND adminID = 5
  AND new_is_read = FALSE;

ROLLBACK;

-- 19. Student marks a review notification read (Student ID = 2, Notification ID = 11)
START TRANSACTION;

UPDATE review_notifications
SET review_is_read = TRUE
WHERE notificationID = 11
  AND studentID = 2
  AND review_is_read = FALSE;

ROLLBACK;

-- 20. Student likes a report (Student ID = 1, Report ID = 10)
START TRANSACTION;

INSERT INTO likes (studentID, reportID)
SELECT 1, 10
FROM students
WHERE userID = 1
  AND EXISTS (SELECT 1 FROM reports WHERE reportID = 10)
  AND NOT EXISTS (
    SELECT 1
    FROM likes
    WHERE studentID = 1
      AND reportID = 10
  );

ROLLBACK;

-- 21. Student unlikes a report (Student ID = 1, Report ID = 4)
START TRANSACTION;

DELETE FROM likes
WHERE studentID = 1
  AND reportID = 4;

ROLLBACK;

-- 22. Student favorites a facility (Student ID = 1, Facility ID = 5)
START TRANSACTION;

INSERT INTO favorites (studentID, facilityID)
SELECT 1, 5
FROM students
WHERE userID = 1
  AND EXISTS (
    SELECT 1
    FROM facilities
    WHERE facilityID = 5
  )
  AND NOT EXISTS (
    SELECT 1
    FROM favorites
    WHERE studentID = 1
      AND facilityID = 5
  );

ROLLBACK;

-- 23. Student removes a favorite (Student ID = 1, Facility ID = 1)
START TRANSACTION;

DELETE FROM favorites
WHERE studentID = 1
  AND facilityID = 1;

ROLLBACK;
