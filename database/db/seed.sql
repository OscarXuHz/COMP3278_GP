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

INSERT INTO buildings (buildingID, build_name, campus, map_x, map_y) VALUES
  (26, 'Main Library', 'Main Campus', 278, 430),
  (8, 'Chong Yuet Ming Amenities Centre', 'Main Campus', 142, 363),
  (38, 'Chi Wah Learning Commons', 'Centennial Campus', 534, 440);

INSERT INTO categories (categoryID, category_name) VALUES
  (1, 'Printer'),
  (2, 'Water Dispenser'),
  (3, 'Toilet');

INSERT INTO facilities (
  facilityID, buildingID, categoryID, floor, facility_status
) VALUES
  (1, 26, 1, '1F', 'Available'),
  (2, 8, 2, '3F', 'Available'),
  (3, 38, 3, '2F', 'Unavailable');

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

-- RIC Campus Map demo/data/pois.seed.json; building anchors from buildings.json (map 25.2).
-- Unknown availability and unreported floors are preserved. Printing records may denote service locations.
START TRANSACTION;
INSERT INTO buildings (buildingID, build_name, campus, map_x, map_y) VALUES (36, 'Cheng Yu Tung Tower', 'Centennial Campus', 644, 425);
INSERT INTO buildings (buildingID, build_name, campus, map_x, map_y) VALUES (13, 'T.T. Tsui Building', 'Main Campus', 129, 480);
INSERT INTO buildings (buildingID, build_name, campus, map_x, map_y) VALUES (32, 'Haking Wong Building', 'Main Campus', 402, 393);
-- water-law-1f
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1001, 36, 2, '1/F', 'Unknown');
-- water-main-1f
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1002, 26, 2, '1/F', 'Unknown');
-- water-main-2f
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1003, 26, 2, '2/F', 'Unknown');
-- water-main-4f
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1004, 26, 2, '4/F', 'Unknown');
-- water-main-6f
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1005, 26, 2, '6/F', 'Unknown');
-- water-chiwah-1f
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1006, 38, 2, '1/F', 'Unknown');
-- water-chiwah-2f
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1007, 38, 2, '2/F', 'Unknown');
-- water-tttsui-3f
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1008, 13, 2, '3/F', 'Unknown');
-- water-cym-studio303
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1009, 8, 2, 'Floor unspecified', 'Unknown');
-- print-main-library
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1010, 26, 1, 'Floor unspecified', 'Unknown');
-- print-chi-wah
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1011, 38, 1, 'Floor unspecified', 'Unknown');
-- print-law-library
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1012, 36, 1, 'Floor unspecified', 'Unknown');
-- print-haking-311
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1013, 32, 1, 'Floor unspecified', 'Unknown');
-- print-haking-312
INSERT INTO facilities (facilityID, buildingID, categoryID, floor, facility_status) VALUES (1014, 32, 1, 'Floor unspecified', 'Unknown');
COMMIT;
