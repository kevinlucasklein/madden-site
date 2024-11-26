------------------------------------------
-- LOOKUP/REFERENCE TABLES
------------------------------------------

CREATE TABLE position_type (
    type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE  -- Offense, Defense, Special Teams
);

CREATE TABLE position (
    position_id SERIAL PRIMARY KEY,
    position VARCHAR(50) NOT NULL,
    type_id INTEGER NOT NULL,
    FOREIGN KEY (type_id) REFERENCES position_type(type_id)
);

-- Team Organization
CREATE TABLE league_conference (
    conference_id SERIAL PRIMARY KEY,
    conference_name VARCHAR(50) NOT NULL UNIQUE,
    conference_abbreviation VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE league_division (
    division_id SERIAL PRIMARY KEY,
    division_name VARCHAR(50) NOT NULL UNIQUE,
    conference_id INTEGER NOT NULL,
    FOREIGN KEY (conference_id) REFERENCES league_conference(conference_id)
);

CREATE TABLE team (
    team_id SERIAL PRIMARY KEY,
    team_label VARCHAR(100) NOT NULL,
    division_id INTEGER NOT NULL,
    FOREIGN KEY (division_id) REFERENCES league_division(division_id)
);

CREATE TABLE development_trait (
    trait_id SERIAL PRIMARY KEY,
    trait_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE running_style (
    style_id SERIAL PRIMARY KEY,
    style_name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE handedness (
    handedness_id SERIAL PRIMARY KEY,
    handedness VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE division (
    division_id SERIAL PRIMARY KEY,
    division_name VARCHAR(50) NOT NULL UNIQUE,
    division_level INTEGER NOT NULL
);

CREATE TABLE conference (
    conference_id SERIAL PRIMARY KEY,
    conference_name VARCHAR(100) NOT NULL UNIQUE,
    conference_abbreviation VARCHAR(20),
    division_id INTEGER NOT NULL,
    FOREIGN KEY (division_id) REFERENCES division(division_id)
);

CREATE TABLE college (
    college_id SERIAL PRIMARY KEY,
    college_name VARCHAR(100) NOT NULL UNIQUE,
    conference_id INTEGER,
    mascot VARCHAR(100),
    primary_color VARCHAR(7),
    secondary_color VARCHAR(7),
    FOREIGN KEY (conference_id) REFERENCES conference(conference_id)
);

CREATE TABLE ability (
    ability_id SERIAL PRIMARY KEY,
    ability VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE image_type (
    type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE draft_type (
    type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

------------------------------------------
-- PLAYER TABLES
------------------------------------------

CREATE TABLE player (
    player_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    height DECIMAL(5,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    college_id INTEGER,
    handedness_id INTEGER,
    age INTEGER NOT NULL,
    jersey_number INTEGER,
    years_pro INTEGER NOT NULL,
    position_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    FOREIGN KEY (college_id) REFERENCES college(college_id),
    FOREIGN KEY (handedness_id) REFERENCES handedness(handedness_id),
    FOREIGN KEY (position_id) REFERENCES position(position_id),
    FOREIGN KEY (team_id) REFERENCES team(team_id)
);

CREATE TABLE player_ability (
    player_ability_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    ability_id INTEGER NOT NULL,
    FOREIGN KEY (player_id) REFERENCES player(player_id),
    FOREIGN KEY (ability_id) REFERENCES ability(ability_id),
    UNIQUE(player_id, ability_id)
);

CREATE TABLE player_rating (
    rating_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL UNIQUE,
    style_id INTEGER,
    development_trait_id INTEGER NOT NULL,
    overall INTEGER NOT NULL,
    acceleration INTEGER NOT NULL,
    agility INTEGER NOT NULL,
    jumping INTEGER NOT NULL,
    stamina INTEGER NOT NULL,
    strength INTEGER NOT NULL,
    awareness INTEGER NOT NULL,
    bcvision INTEGER NOT NULL,
    block_shedding INTEGER NOT NULL,
    break_sack INTEGER NOT NULL,
    break_tackle INTEGER NOT NULL,
    carrying INTEGER NOT NULL,
    catch_in_traffic INTEGER NOT NULL,
    catching INTEGER NOT NULL,
    change_of_direction INTEGER NOT NULL,
    deep_route_running INTEGER NOT NULL,
    finesse_moves INTEGER NOT NULL,
    hit_power INTEGER NOT NULL,
    impact_blocking INTEGER NOT NULL,
    injury INTEGER NOT NULL,
    juke_move INTEGER NOT NULL,
    kick_accuracy INTEGER NOT NULL,
    kick_power INTEGER NOT NULL,
    kick_return INTEGER NOT NULL,
    lead_block INTEGER NOT NULL,
    man_coverage INTEGER NOT NULL,
    medium_route_running INTEGER NOT NULL,
    pass_block INTEGER NOT NULL,
    pass_block_finesse INTEGER NOT NULL,
    pass_block_power INTEGER NOT NULL,
    play_action INTEGER NOT NULL,
    play_recognition INTEGER NOT NULL,
    power_moves INTEGER NOT NULL,
    press INTEGER NOT NULL,
    pursuit INTEGER NOT NULL,
    release INTEGER NOT NULL,
    run_block INTEGER NOT NULL,
    run_block_finesse INTEGER NOT NULL,
    run_block_power INTEGER NOT NULL,
    short_route_running INTEGER NOT NULL,
    spectacular_catch INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    spin_move INTEGER NOT NULL,
    stiff_arm INTEGER NOT NULL,
    tackle INTEGER NOT NULL,
    throw_accuracy_deep INTEGER NOT NULL,
    throw_accuracy_mid INTEGER NOT NULL,
    throw_accuracy_short INTEGER NOT NULL,
    throw_on_the_run INTEGER NOT NULL,
    throw_power INTEGER NOT NULL,
    throw_under_pressure INTEGER NOT NULL,
    toughness INTEGER NOT NULL,
    trucking INTEGER NOT NULL,
    zone_coverage INTEGER NOT NULL,
    FOREIGN KEY (player_id) REFERENCES player(player_id),
    FOREIGN KEY (style_id) REFERENCES running_style(style_id),
    FOREIGN KEY (development_trait_id) REFERENCES development_trait(trait_id)
);

------------------------------------------
-- IMAGE TABLES
------------------------------------------

CREATE TABLE player_image (
    image_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    type_id INTEGER NOT NULL,
    FOREIGN KEY (player_id) REFERENCES player(player_id),
    FOREIGN KEY (type_id) REFERENCES image_type(type_id),
    UNIQUE(player_id, type_id)
);

CREATE TABLE team_image (
    image_id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    type_id INTEGER NOT NULL,
    FOREIGN KEY (team_id) REFERENCES team(team_id),
    FOREIGN KEY (type_id) REFERENCES image_type(type_id),
    UNIQUE(team_id, type_id)
);

CREATE TABLE college_image (
    image_id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    type_id INTEGER NOT NULL,
    FOREIGN KEY (college_id) REFERENCES college(college_id),
    FOREIGN KEY (type_id) REFERENCES image_type(type_id),
    UNIQUE(college_id, type_id)
);

CREATE TABLE dev_trait_image (
    image_id SERIAL PRIMARY KEY,
    trait_id INTEGER NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    type_id INTEGER NOT NULL,
    FOREIGN KEY (trait_id) REFERENCES development_trait(trait_id),
    FOREIGN KEY (type_id) REFERENCES image_type(type_id),
    UNIQUE(trait_id, type_id)
);

------------------------------------------
-- USER & DRAFT TABLES
------------------------------------------

CREATE TABLE users (  -- Changed from "user" as it's a reserved word in PostgreSQL
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_draft (
    draft_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    draft_name VARCHAR(100) NOT NULL,
    draft_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE draft_settings (
    settings_id SERIAL PRIMARY KEY,
    draft_id INTEGER NOT NULL UNIQUE,
    type_id INTEGER NOT NULL,
    total_rounds INTEGER NOT NULL DEFAULT 54,
    total_teams INTEGER NOT NULL DEFAULT 32,
    user_draft_position INTEGER NOT NULL,
    FOREIGN KEY (draft_id) REFERENCES user_draft(draft_id),
    FOREIGN KEY (type_id) REFERENCES draft_type(type_id),
    CHECK (user_draft_position >= 1 AND user_draft_position <= total_teams),
    CHECK (total_teams = 32)
);

CREATE TABLE draft_pick_order (
    order_id SERIAL PRIMARY KEY,
    settings_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    overall_pick INTEGER NOT NULL,
    is_user_pick BOOLEAN NOT NULL,
    FOREIGN KEY (settings_id) REFERENCES draft_settings(settings_id),
    UNIQUE(settings_id, round_number, pick_number),
    UNIQUE(settings_id, overall_pick)
);

CREATE TABLE user_draft_pick (
    pick_id SERIAL PRIMARY KEY,
    draft_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    overall_pick INTEGER NOT NULL,
    round INTEGER NOT NULL,
    pick_in_round INTEGER NOT NULL,
    pick_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (draft_id) REFERENCES user_draft(draft_id),
    FOREIGN KEY (player_id) REFERENCES player(player_id)
);

CREATE TABLE draft_data (
    draft_id SERIAL PRIMARY KEY,
    player_id INTEGER NOT NULL,
    overall_pick INTEGER NOT NULL,
    pick_round INTEGER NOT NULL,
    pick_in_round INTEGER NOT NULL,
    FOREIGN KEY (player_id) REFERENCES player(player_id)
);

CREATE TABLE roster_requirements (
    requirement_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    position_id INTEGER NOT NULL,
    min_overall INTEGER,
    min_speed INTEGER,
    min_strength INTEGER,
    min_awareness INTEGER,
    min_age INTEGER,
    max_age INTEGER,
    min_years_pro INTEGER,
    max_years_pro INTEGER,
    min_height DECIMAL(5,2),
    max_height DECIMAL(5,2),
    min_weight DECIMAL(5,2),
    max_weight DECIMAL(5,2),
    preferred_handedness_id INTEGER,
    preferred_conference_id INTEGER,
    preferred_dev_trait_id INTEGER,
    requires_ability_id INTEGER,
    ability_threshold_count INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (position_id) REFERENCES position(position_id),
    FOREIGN KEY (preferred_handedness_id) REFERENCES handedness(handedness_id),
    FOREIGN KEY (preferred_conference_id) REFERENCES conference(conference_id),
    FOREIGN KEY (preferred_dev_trait_id) REFERENCES development_trait(trait_id),
    FOREIGN KEY (requires_ability_id) REFERENCES ability(ability_id),
    UNIQUE(user_id, position_id)
);

CREATE TABLE draft_recommendation (
    recommendation_id SERIAL PRIMARY KEY,
    draft_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    round_number INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    recommendation_score DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (draft_id) REFERENCES user_draft(draft_id),
    FOREIGN KEY (player_id) REFERENCES player(player_id),
    UNIQUE(draft_id, player_id, round_number, pick_number)
);

------------------------------------------
-- INDEXES
------------------------------------------

CREATE INDEX idx_player_position ON player(position_id);
CREATE INDEX idx_player_team ON player(team_id);
CREATE INDEX idx_player_college ON player(college_id);
CREATE INDEX idx_player_handedness ON player(handedness_id);
CREATE INDEX idx_position_type ON position(type_id);
CREATE INDEX idx_college_conference ON college(conference_id);
CREATE INDEX idx_conference_division ON conference(division_id);
CREATE INDEX idx_player_ability_player ON player_ability(player_id);
CREATE INDEX idx_player_ability_ability ON player_ability(ability_id);
CREATE INDEX idx_player_rating_style ON player_rating(style_id);
CREATE INDEX idx_player_rating_dev_trait ON player_rating(development_trait_id);
CREATE INDEX idx_draft_data_player ON draft_data(player_id);
CREATE INDEX idx_user_draft_user ON user_draft(user_id);
CREATE INDEX idx_user_draft_pick_draft ON user_draft_pick(draft_id);
CREATE INDEX idx_user_draft_pick_player ON user_draft_pick(player_id);
CREATE INDEX idx_roster_requirements_user ON roster_requirements(user_id);
CREATE INDEX idx_roster_requirements_position ON roster_requirements(position_id);
CREATE INDEX idx_roster_requirements_dev_trait ON roster_requirements(preferred_dev_trait_id);
CREATE INDEX idx_roster_requirements_handedness ON roster_requirements(preferred_handedness_id);
CREATE INDEX idx_roster_requirements_conference ON roster_requirements(preferred_conference_id);
CREATE INDEX idx_college_image_type ON college_image(type_id);
CREATE INDEX idx_team_image_type ON team_image(type_id);
CREATE INDEX idx_player_image_type ON player_image(type_id);
CREATE INDEX idx_dev_trait_image_type ON dev_trait_image(type_id);
CREATE INDEX idx_draft_recommendation_draft ON draft_recommendation(draft_id);
CREATE INDEX idx_draft_recommendation_player ON draft_recommendation(player_id);
CREATE INDEX idx_draft_recommendation_score ON draft_recommendation(recommendation_score);
CREATE INDEX idx_draft_recommendation_round_pick ON draft_recommendation(draft_id, round_number, pick_number);
CREATE INDEX idx_team_division ON team(division_id);
CREATE INDEX idx_league_division_conference ON league_division(conference_id);
CREATE INDEX idx_draft_settings_type ON draft_settings(type_id);
CREATE INDEX idx_draft_pick_order_settings ON draft_pick_order(settings_id);

------------------------------------------
-- VIEWS
------------------------------------------

CREATE VIEW user_draft_picks AS
SELECT 
    ds.draft_id,
    dpo.round_number,
    dpo.pick_number,
    dpo.overall_pick,
    dt.type_name as draft_type,
    ud.draft_name
FROM draft_pick_order dpo
JOIN draft_settings ds ON dpo.settings_id = ds.settings_id
JOIN draft_type dt ON ds.type_id = dt.type_id
JOIN user_draft ud ON ds.draft_id = ud.draft_id
WHERE dpo.is_user_pick = true
ORDER BY dpo.overall_pick;

CREATE VIEW team_info AS
SELECT 
    t.team_id,
    t.team_label,
    ld.division_name,
    lc.conference_abbreviation
FROM team t
JOIN league_division ld ON t.division_id = ld.division_id
JOIN league_conference lc ON ld.conference_id = lc.conference_id;

CREATE VIEW player_summary AS
SELECT 
    p.player_id,
    p.first_name,
    p.last_name,
    p.height,
    p.weight,
    p.age,
    p.years_pro,
    pos.position,
    pt.type_name as position_type,
    t.team_label,
    c.college_name,
    conf.conference_name as college_conference,
    pr.overall,
    dt.trait_name as development_trait,
    rs.style_name as running_style
FROM player p
JOIN position pos ON p.position_id = pos.position_id
JOIN position_type pt ON pos.type_id = pt.type_id
JOIN team t ON p.team_id = t.team_id
LEFT JOIN college c ON p.college_id = c.college_id
LEFT JOIN conference conf ON c.conference_id = conf.conference_id
JOIN player_rating pr ON p.player_id = pr.player_id
JOIN development_trait dt ON pr.development_trait_id = dt.trait_id
LEFT JOIN running_style rs ON pr.style_id = rs.style_id;