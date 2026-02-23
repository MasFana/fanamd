-- 1. FOLDERS
DEFINE TABLE folder SCHEMAFULL;
DEFINE FIELD name ON TABLE folder TYPE string ASSERT string::len($value) > 0 AND string::len($value) <= 255;
DEFINE FIELD is_open ON TABLE folder TYPE bool DEFAULT false;
DEFINE FIELD created_at ON TABLE folder TYPE datetime DEFAULT time::now() READONLY;

-- 2. FILES
DEFINE TABLE file SCHEMAFULL;
DEFINE FIELD title ON TABLE file TYPE string ASSERT string::len($value) > 0 AND string::len($value) <= 255;
DEFINE FIELD content ON TABLE file TYPE string DEFAULT "";
DEFINE FIELD created_at ON TABLE file TYPE datetime DEFAULT time::now() READONLY;
DEFINE FIELD updated_at ON TABLE file TYPE datetime DEFAULT time::now() VALUE time::now();

-- 3. THE GRAPH EDGE (Relationship)
-- IN is always the parent folder. OUT is the child (either a folder or file).
DEFINE TABLE contains SCHEMAFULL TYPE RELATION IN folder OUT folder | file;

-- 4 Auto Cascade Delete Function
DEFINE FUNCTION fn::recursive_delete($node: record) {
    -- 1. Find all children connected via 'contains'
    LET $children = (SELECT VALUE out FROM contains WHERE in = $node);

    -- 2. Recurse into children first (bottom-up deletion)
    FOR $child IN $children {
        fn::recursive_delete($child);
    };

    -- 3. Delete the actual record (folder or file)
    -- SurrealDB automatically deletes the 'contains' edges
    -- connected to this record when the record is deleted.
    DELETE $node;
};

-- Indexing for performance when traversing
DEFINE INDEX idx_contains_in ON TABLE contains COLUMNS in;
DEFINE INDEX idx_contains_out ON TABLE contains COLUMNS out;


--
--
--
--
--
--
BEGIN TRANSACTION;

-- 1. Create Folders
-- Level 0
LET $root = (CREATE folder SET name = 'Root');

-- Level 1
LET $docs = (CREATE folder SET name = 'Documents');
LET $media = (CREATE folder SET name = 'Media');
LET $trash = (CREATE folder SET name = 'Trash');

-- Level 2
LET $work = (CREATE folder SET name = 'Work Projects');
LET $personal = (CREATE folder SET name = 'Personal');
LET $photos = (CREATE folder SET name = 'Photos');

-- 2. Create Files
LET $f_readme = (CREATE file SET title = 'README.txt', content = 'Welcome to the file system.');
LET $f_budget = (CREATE file SET title = '2024_Budget.xlsx', content = 'raw_binary_content_mock');
LET $f_notes = (CREATE file SET title = 'meeting_notes.md', content = '# Monday Meeting\n- Discuss database schema');
LET $f_logo = (CREATE file SET title = 'logo.png', content = 'image_data');
LET $f_old = (CREATE file SET title = 'old_config.json', content = '{}');

-- 3. Create Relationships (The 'contains' edge)

-- Link Root to Level 1
RELATE $root->contains->$docs;
RELATE $root->contains->$media;
RELATE $root->contains->$trash;
RELATE $root->contains->$f_readme; -- File directly in root

-- Link Documents to Subfolders and Files
RELATE $docs->contains->$work;
RELATE $docs->contains->$personal;

-- Link Media to Subfolders
RELATE $media->contains->$photos;

-- Link Work Folder to Files
RELATE $work->contains->$f_budget;
RELATE $work->contains->$f_notes;

-- Link Photos to File
RELATE $photos->contains->$f_logo;

-- Link Trash to File
RELATE $trash->contains->$f_old;

COMMIT TRANSACTION;

-- 4. Verify Data (Fetch tree starting from Root)
SELECT
    id,
    name,
    ->contains->? AS children
FROM $root;

--
--
--
--
--
--

SELECT
    id,
    name,
    -- Get the sub-folders
    ->contains->folder AS sub_folders,
    -- Get the files
    ->contains->file AS files
FROM folder;

SELECT
    ->contains->folder.* AS folders,
    ->contains->file.* AS files
FROM folder;


-- 1. Make sure to format the ID correctly (optional but safer)

-- BEGIN TRANSACTION;
-- LET $parentId = type::thing("folder","rr008h2ekzu5t0khbg9q");

--     -- 2. Create returns an ARRAY, so we store it
--     LET $new_folder = (CREATE folder CONTENT {
--         name: "KontolEwe2",
--         is_open: false
--     });

--     -- 3. Use braces {} for IF statements in SurrealDB
--     -- 4. Fix the variable name typo ($parent_id -> $parentId)
--     IF $parentId != NONE {
--         RELATE $parentId->contains->($new_folder[0].id);
--     };

-- RETURN $new_folder[0];
-- COMMIT TRANSACTION;
LET $fana = SELECT @{1..}.{
    id,
    out: ->contains->(folder, file).@
}
FROM (SELECT VALUE id FROM folder WHERE count(<-contains)=0);


RETURN $fana;
