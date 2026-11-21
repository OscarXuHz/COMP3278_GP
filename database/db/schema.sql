CREATE DATABASE IF NOT EXISTS campus_atlas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_as_cs;

USE campus_atlas;

CREATE TABLE users (
  userID BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  user_password VARCHAR(255) NOT NULL
);

CREATE TABLE students (
  userID BIGINT UNSIGNED PRIMARY KEY,
  FOREIGN KEY (userID) REFERENCES users (userID)
);

CREATE TABLE admins (
  userID BIGINT UNSIGNED PRIMARY KEY,
  FOREIGN KEY (userID) REFERENCES users (userID)
);

CREATE TABLE buildings (
  buildingID VARCHAR(10) PRIMARY KEY,
  build_name VARCHAR(150) NOT NULL,
  map_x INT UNSIGNED NOT NULL,
  map_y INT UNSIGNED NOT NULL,
  campus VARCHAR(100) NOT NULL
);

CREATE TABLE categories (
  categoryID BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE facilities (
  facilityID BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  buildingID VARCHAR(10) NOT NULL,
  categoryID BIGINT UNSIGNED NOT NULL,
  floor VARCHAR(20) NOT NULL,
  facility_note VARCHAR(255) NULL,
  facility_status VARCHAR(20) NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT facilities_note_chk
    CHECK (facility_note IS NULL OR CHAR_LENGTH(facility_note) BETWEEN 1 AND 255),
  CONSTRAINT facilities_status_chk
    CHECK (facility_status IN ('Available', 'Unavailable')),
  FOREIGN KEY (buildingID) REFERENCES buildings (buildingID),
  FOREIGN KEY (categoryID) REFERENCES categories (categoryID)
);

CREATE TABLE reports (
  reportID BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  facilityID BIGINT UNSIGNED NOT NULL,
  studentID BIGINT UNSIGNED NOT NULL,
  adminID BIGINT UNSIGNED NULL,
  proposed_status VARCHAR(20) NOT NULL,
  review_status VARCHAR(20) NOT NULL,
  create_note TEXT NULL,
  review_note TEXT NULL,
  review_time TIMESTAMP NULL,
  report_create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT reports_proposed_status_chk
    CHECK (proposed_status IN ('Available', 'Unavailable')),
  CONSTRAINT reports_review_status_chk
    CHECK (review_status IN ('Pending', 'Approved', 'Rejected', 'Expired')),
  CONSTRAINT reports_review_fields_chk
    CHECK (
      (review_status IN ('Pending', 'Expired')
        AND adminID IS NULL
        AND review_time IS NULL)
      OR
      (review_status IN ('Approved', 'Rejected')
        AND adminID IS NOT NULL
        AND review_time IS NOT NULL)
    ),
  FOREIGN KEY (facilityID) REFERENCES facilities (facilityID),
  FOREIGN KEY (studentID) REFERENCES students (userID),
  FOREIGN KEY (adminID) REFERENCES admins (userID)
);

CREATE TABLE report_photos (
  reportID BIGINT UNSIGNED NOT NULL,
  photo VARCHAR(512) NOT NULL,
  PRIMARY KEY (reportID, photo),
  FOREIGN KEY (reportID) REFERENCES reports (reportID)
);

CREATE TABLE revisions (
  revisionID BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  facilityID BIGINT UNSIGNED NOT NULL,
  reportID BIGINT UNSIGNED NULL,
  adminID BIGINT UNSIGNED NOT NULL,
  old_status VARCHAR(20) NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  revision_create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (reportID),
  CONSTRAINT revisions_old_status_chk
    CHECK (old_status IN ('Available', 'Unavailable')),
  CONSTRAINT revisions_new_status_chk
    CHECK (new_status IN ('Available', 'Unavailable')),
  FOREIGN KEY (facilityID) REFERENCES facilities (facilityID),
  FOREIGN KEY (reportID) REFERENCES reports (reportID),
  FOREIGN KEY (adminID) REFERENCES admins (userID)
);

CREATE TABLE likes (
  studentID BIGINT UNSIGNED NOT NULL,
  reportID BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (studentID, reportID),
  FOREIGN KEY (studentID) REFERENCES students (userID),
  FOREIGN KEY (reportID) REFERENCES reports (reportID)
);

CREATE TABLE favorites (
  studentID BIGINT UNSIGNED NOT NULL,
  facilityID BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (studentID, facilityID),
  FOREIGN KEY (studentID) REFERENCES students (userID),
  FOREIGN KEY (facilityID) REFERENCES facilities (facilityID)
);

CREATE TABLE notifications (
  notificationID BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  notification_create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE review_notifications (
  notificationID BIGINT UNSIGNED PRIMARY KEY,
  reportID BIGINT UNSIGNED NOT NULL,
  studentID BIGINT UNSIGNED NOT NULL,
  review_is_read BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (reportID),
  FOREIGN KEY (notificationID) REFERENCES notifications (notificationID),
  FOREIGN KEY (reportID) REFERENCES reports (reportID),
  FOREIGN KEY (studentID) REFERENCES students (userID)
);

CREATE TABLE new_notifications (
  notificationID BIGINT UNSIGNED PRIMARY KEY,
  reportID BIGINT UNSIGNED NOT NULL,
  adminID BIGINT UNSIGNED NOT NULL,
  new_is_read BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (reportID, adminID),
  FOREIGN KEY (notificationID) REFERENCES notifications (notificationID),
  FOREIGN KEY (reportID) REFERENCES reports (reportID),
  FOREIGN KEY (adminID) REFERENCES admins (userID)
);

-- When two or more active facilities share a building, category, and floor,
-- each one must have a note. A single facility on that floor may leave it empty.
DELIMITER $$

CREATE TRIGGER facilities_note_required_insert
BEFORE INSERT ON facilities
FOR EACH ROW
BEGIN
  IF NEW.archived = FALSE AND EXISTS (
    SELECT 1
    FROM facilities AS other
    WHERE other.buildingID = NEW.buildingID
      AND other.categoryID = NEW.categoryID
      AND other.floor = NEW.floor
      AND other.archived = FALSE
      AND (NEW.facility_note IS NULL OR other.facility_note IS NULL)
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Facilities sharing a building, category, and floor must each have a note';
  END IF;
END$$

CREATE TRIGGER facilities_note_required_update
BEFORE UPDATE ON facilities
FOR EACH ROW
BEGIN
  IF NEW.archived = FALSE AND EXISTS (
    SELECT 1
    FROM facilities AS other
    WHERE other.buildingID = NEW.buildingID
      AND other.categoryID = NEW.categoryID
      AND other.floor = NEW.floor
      AND other.archived = FALSE
      AND other.facilityID <> NEW.facilityID
      AND (NEW.facility_note IS NULL OR other.facility_note IS NULL)
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Facilities sharing a building, category, and floor must each have a note';
  END IF;
END$$

DELIMITER ;
