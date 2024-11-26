import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432'),
});

// Type definitions
interface InsertResult {
    table: string;
    rowCount: number | null;  // Allow null values
    error?: string;
}

async function populateStaticData(): Promise<void> {
    const client = await pool.connect();
    const results: InsertResult[] = [];

    try {
        await client.query('BEGIN');

        // Position Types
        const positionTypes = [
            { name: 'Offense' },
            { name: 'Defense' },
            { name: 'Special Teams' }
        ];

        const positionTypeResult = await client.query(`
            INSERT INTO position_type (type_name)
            VALUES ${positionTypes.map((_, i) => `($${i + 1})`).join(', ')}
            ON CONFLICT (type_name) DO NOTHING
            RETURNING type_id
        `, positionTypes.map(pt => pt.name));

        results.push({
            table: 'position_type',
            rowCount: positionTypeResult.rowCount
        });

        // Positions
        const positions = [
            { position: 'QB', type: 'Offense' },
            { position: 'HB', type: 'Offense' },
            { position: 'FB', type: 'Offense' },
            { position: 'WR', type: 'Offense' },
            { position: 'TE', type: 'Offense' },
            { position: 'LT', type: 'Offense' },
            { position: 'LG', type: 'Offense' },
            { position: 'C', type: 'Offense' },
            { position: 'RG', type: 'Offense' },
            { position: 'RT', type: 'Offense' },
            { position: 'LE', type: 'Defense' },
            { position: 'RE', type: 'Defense' },
            { position: 'DT', type: 'Defense' },
            { position: 'LOLB', type: 'Defense' },
            { position: 'MLB', type: 'Defense' },
            { position: 'ROLB', type: 'Defense' },
            { position: 'CB', type: 'Defense' },
            { position: 'FS', type: 'Defense' },
            { position: 'SS', type: 'Defense' },
            { position: 'K', type: 'Special Teams' },
            { position: 'P', type: 'Special Teams' }
        ];

        for (const pos of positions) {
            await client.query(`
                INSERT INTO position (position, type_id)
                VALUES ($1, (SELECT type_id FROM position_type WHERE type_name = $2))
                ON CONFLICT (position) DO NOTHING
            `, [pos.position, pos.type]);
        }

        results.push({
            table: 'position',
            rowCount: positions.length
        });

        // Development Traits
        const devTraits = [
            'Normal',
            'Star',
            'Superstar',
            'X-Factor'
        ];

        const devTraitResult = await client.query(`
            INSERT INTO development_trait (trait_name)
            VALUES ${devTraits.map((_, i) => `($${i + 1})`).join(', ')}
            ON CONFLICT (trait_name) DO NOTHING
        `, devTraits);

        results.push({
            table: 'development_trait',
            rowCount: devTraitResult.rowCount
        });

        // Running Styles
        const runningStyles = [
            'None',
            'Long Stride Loose',
            'Default',
            'Long Stride High and Tight',
            'Default Stride Awkward',
            'Short Stride Bread Loaf',
            'Default Stride Loose',
            'Short Stride Default',
            'Long Stride Default',
            'Default Stride High and Tight',
            'Short Stride High and Tight',
            'Short Stride Loose',
            'Long Stride Awkward',
            'Short Stride Awkward',
            'Long Stride Bread Loaf',
            'Default Stride Bread Loaf'
        ];

        const runningStyleResult = await client.query(`
            INSERT INTO running_style (style_name)
            VALUES ${runningStyles.map((_, i) => `($${i + 1})`).join(', ')}
            ON CONFLICT (style_name) DO NOTHING
        `, runningStyles);

        results.push({
            table: 'running_style',
            rowCount: runningStyleResult.rowCount
        });

        // Handedness
        const handedness = ['Right', 'Left'];

        const handednessResult = await client.query(`
            INSERT INTO handedness (handedness)
            VALUES ${handedness.map((_, i) => `($${i + 1})`).join(', ')}
            ON CONFLICT (handedness) DO NOTHING
        `, handedness);

        results.push({
            table: 'handedness',
            rowCount: handednessResult.rowCount
        });

        // League Conferences
        const leagueConferences = [
            { name: 'American Football Conference', abbrev: 'AFC' },
            { name: 'National Football Conference', abbrev: 'NFC' }
        ];

        for (const conf of leagueConferences) {
            await client.query(`
                INSERT INTO league_conference (conference_name, conference_abbreviation)
                VALUES ($1, $2)
                ON CONFLICT (conference_abbreviation) DO NOTHING
            `, [conf.name, conf.abbrev]);
        }

        // League Divisions
        const leagueDivisions = [
            { name: 'AFC North', conference: 'AFC' },
            { name: 'AFC South', conference: 'AFC' },
            { name: 'AFC East', conference: 'AFC' },
            { name: 'AFC West', conference: 'AFC' },
            { name: 'NFC North', conference: 'NFC' },
            { name: 'NFC South', conference: 'NFC' },
            { name: 'NFC East', conference: 'NFC' },
            { name: 'NFC West', conference: 'NFC' }
        ];

        for (const div of leagueDivisions) {
            await client.query(`
                INSERT INTO league_division (division_name, conference_id)
                VALUES ($1, (SELECT conference_id FROM league_conference WHERE conference_abbreviation = $2))
                ON CONFLICT (division_name) DO NOTHING
            `, [div.name, div.conference]);
        }

        // Teams
        const teams = [
            // AFC North
            { label: 'Baltimore Ravens', division: 'AFC North' },
            { label: 'Cincinnati Bengals', division: 'AFC North' },
            { label: 'Cleveland Browns', division: 'AFC North' },
            { label: 'Pittsburgh Steelers', division: 'AFC North' },
            
            // AFC South
            { label: 'Houston Texans', division: 'AFC South' },
            { label: 'Indianapolis Colts', division: 'AFC South' },
            { label: 'Jacksonville Jaguars', division: 'AFC South' },
            { label: 'Tennessee Titans', division: 'AFC South' },
            
            // AFC East
            { label: 'Buffalo Bills', division: 'AFC East' },
            { label: 'Miami Dolphins', division: 'AFC East' },
            { label: 'New England Patriots', division: 'AFC East' },
            { label: 'New York Jets', division: 'AFC East' },
            
            // AFC West
            { label: 'Denver Broncos', division: 'AFC West' },
            { label: 'Kansas City Chiefs', division: 'AFC West' },
            { label: 'Las Vegas Raiders', division: 'AFC West' },
            { label: 'Los Angeles Chargers', division: 'AFC West' },
            
            // NFC North
            { label: 'Chicago Bears', division: 'NFC North' },
            { label: 'Detroit Lions', division: 'NFC North' },
            { label: 'Green Bay Packers', division: 'NFC North' },
            { label: 'Minnesota Vikings', division: 'NFC North' },
            
            // NFC South
            { label: 'Atlanta Falcons', division: 'NFC South' },
            { label: 'Carolina Panthers', division: 'NFC South' },
            { label: 'New Orleans Saints', division: 'NFC South' },
            { label: 'Tampa Bay Buccaneers', division: 'NFC South' },
            
            // NFC East
            { label: 'Dallas Cowboys', division: 'NFC East' },
            { label: 'New York Giants', division: 'NFC East' },
            { label: 'Philadelphia Eagles', division: 'NFC East' },
            { label: 'Washington Commanders', division: 'NFC East' },
            
            // NFC West
            { label: 'Arizona Cardinals', division: 'NFC West' },
            { label: 'Los Angeles Rams', division: 'NFC West' },
            { label: 'San Francisco 49ers', division: 'NFC West' },
            { label: 'Seattle Seahawks', division: 'NFC West' }
        ];

        for (const team of teams) {
            await client.query(`
                INSERT INTO team (team_label, division_id)
                VALUES ($1, (SELECT division_id FROM league_division WHERE division_name = $2))
                ON CONFLICT (team_label) DO NOTHING
            `, [team.label, team.division]);
        }

        // College Divisions
        const collegeDivisions = [
            { name: 'FBS', level: 1 },
            { name: 'FCS', level: 2 },
            { name: 'Division II', level: 3 },
            { name: 'Division III', level: 4 },
            { name: 'No Division', level: 5 },
            { name: 'International', level: 6 },
            { name: 'Division I', level: 7 },
            { name: 'NAIA', level: 8 }
        ];

        for (const div of collegeDivisions) {
            await client.query(`
                INSERT INTO division (division_name, division_level)
                VALUES ($1, $2)
                ON CONFLICT (division_name) DO NOTHING
            `, [div.name, div.level]);
        }

        // College Conferences
        const collegeConferences = [
            // FBS Conferences
            { name: 'American Athletic Conference', abbrev: 'The American', division: 'FBS' },
            { name: 'Atlantic Coast Conference', abbrev: 'ACC', division: 'FBS' },
            { name: 'Big 12 Conference', abbrev: 'Big 12', division: 'FBS' },
            { name: 'Big Ten Conference', abbrev: 'Big Ten', division: 'FBS' },
            { name: 'Conference USA', abbrev: 'C-USA', division: 'FBS' },
            { name: 'Mid-American Conference', abbrev: 'MAC', division: 'FBS' },
            { name: 'Mountain West Conference', abbrev: 'MW', division: 'FBS' },
            { name: 'Pac-12 Conference', abbrev: 'Pac-12', division: 'FBS' },
            { name: 'Southeastern Conference', abbrev: 'SEC', division: 'FBS' },
            { name: 'Sun Belt Conference', abbrev: 'SBC', division: 'FBS' },
            { name: 'FBS Independent', abbrev: 'FBS-Ind', division: 'FBS' },

            // FCS Conferences
            { name: 'Big Sky Conference', abbrev: 'Big Sky', division: 'FCS' },
            { name: 'Big South–OVC Football Association', abbrev: 'Big South-OVC', division: 'FCS' },
            { name: 'CAA Football', abbrev: 'CAA', division: 'FCS' },
            { name: 'Ivy League', abbrev: 'Ivy', division: 'FCS' },
            { name: 'Mid-Eastern Athletic Conference', abbrev: 'MEAC', division: 'FCS' },
            { name: 'Missouri Valley Football Conference', abbrev: 'MVFC', division: 'FCS' },
            { name: 'Northeast Conference', abbrev: 'NEC', division: 'FCS' },
            { name: 'Patriot League', abbrev: 'Patriot', division: 'FCS' },
            { name: 'Pioneer Football League', abbrev: 'Pioneer', division: 'FCS' },
            { name: 'Southern Conference', abbrev: 'SoCon', division: 'FCS' },
            { name: 'Southland Conference', abbrev: 'Southland', division: 'FCS' },
            { name: 'Southwestern Athletic Conference', abbrev: 'SWAC', division: 'FCS' },
            { name: 'United Athletic Conference', abbrev: 'UAC', division: 'FCS' },
            { name: 'FCS Independent', abbrev: 'FCS-Ind', division: 'FCS' },

            // Division I Conferences
            { name: 'Atlantic 10 Conference', abbrev: 'A10', division: 'Division I' },
            { name: 'Metro Atlantic Athletic Conference', abbrev: 'MAAC', division: 'Division I' },

            // Division II Conferences
            { name: 'California Collegiate Athletic Association', abbrev: 'CCAA', division: 'Division II' },
            { name: 'Central Atlantic Collegiate Conference', abbrev: 'CACC', division: 'Division II' },
            { name: 'Central Intercollegiate Athletic Association', abbrev: 'CIAA', division: 'Division II' },
            { name: 'Conference Carolinas', abbrev: 'CC', division: 'Division II' },
            { name: 'East Coast Conference', abbrev: 'ECC', division: 'Division II' },
            { name: 'Great American Conference', abbrev: 'GAC', division: 'Division II' },
            { name: 'Great Lakes Intercollegiate Athletic Conference', abbrev: 'GLIAC', division: 'Division II' },
            { name: 'Great Lakes Valley Conference', abbrev: 'GLVC', division: 'Division II' },
            { name: 'Great Midwest Athletic Conference', abbrev: 'GMAC', division: 'Division II' },
            { name: 'Great Northwest Athletic Conference', abbrev: 'GNAC', division: 'Division II' },
            { name: 'Gulf South Conference', abbrev: 'GSC', division: 'Division II' },
            { name: 'Lone Star Conference', abbrev: 'LSC', division: 'Division II' },
            { name: 'Mid-America Intercollegiate Athletics Association', abbrev: 'MIAA', division: 'Division II' },
            { name: 'Mountain East Conference', abbrev: 'MEC', division: 'Division II' },
            { name: 'Northeast-10 Conference', abbrev: 'NE10', division: 'Division II' },
            { name: 'Northern Sun Intercollegiate Conference', abbrev: 'NSIC', division: 'Division II' },
            { name: 'Pacific West Conference', abbrev: 'PacWest', division: 'Division II' },
            { name: 'Peach Belt Conference', abbrev: 'PBC', division: 'Division II' },
            { name: 'Pennsylvania State Athletic Conference', abbrev: 'PSAC', division: 'Division II' },
            { name: 'Rocky Mountain Athletic Conference', abbrev: 'RMAC', division: 'Division II' },
            { name: 'South Atlantic Conference', abbrev: 'SAC', division: 'Division II' },
            { name: 'Southern Intercollegiate Athletic Conference', abbrev: 'SIAC', division: 'Division II' },
            { name: 'Sunshine State Conference', abbrev: 'SSC', division: 'Division II' },
            { name: 'Division II Independent', abbrev: 'D2-Ind', division: 'Division II' },

            // Division III Conferences
            { name: 'Allegheny Mountain Collegiate Conference', abbrev: 'AMCC', division: 'Division III' },
            { name: 'American Rivers Conference', abbrev: 'ARC', division: 'Division III' },
            { name: 'American Southwest Conference', abbrev: 'ASC', division: 'Division III' },
            { name: 'Atlantic East Conference', abbrev: 'AEC', division: 'Division III' },
            { name: 'Centennial Conference', abbrev: 'Centennial', division: 'Division III' },
            { name: 'City University of New York Athletic Conference', abbrev: 'CUNYAC', division: 'Division III' },
            { name: 'Coast to Coast Athletic Conference', abbrev: 'C2C', division: 'Division III' },
            { name: 'College Conference of Illinois and Wisconsin', abbrev: 'CCIW', division: 'Division III' },
            { name: 'Collegiate Conference of the South', abbrev: 'CCS', division: 'Division III' },
            { name: 'Commonwealth Coast Conference', abbrev: 'CCC', division: 'Division III' },
            { name: 'Empire 8', abbrev: 'Empire 8', division: 'Division III' },
            { name: 'Great Northeast Athletic Conference', abbrev: 'GNAC', division: 'Division III' },
            { name: 'Heartland Collegiate Athletic Conference', abbrev: 'HCAC', division: 'Division III' },
            { name: 'Landmark Conference', abbrev: 'Landmark', division: 'Division III' },
            { name: 'Liberty League', abbrev: 'Liberty', division: 'Division III' },
            { name: 'Little East Conference', abbrev: 'LEC', division: 'Division III' },
            { name: 'Massachusetts State Collegiate Athletic Conference', abbrev: 'MASCAC', division: 'Division III' },
            { name: 'Michigan Intercollegiate Athletic Association', abbrev: 'MIAA', division: 'Division III' },
            { name: 'Middle Atlantic Conference', abbrev: 'MAC', division: 'Division III' },
            { name: 'Midwest Conference', abbrev: 'MWC', division: 'Division III' },
            { name: 'Minnesota Intercollegiate Athletic Conference', abbrev: 'MIAC', division: 'Division III' },
            { name: 'New England Small College Athletic Conference', abbrev: 'NESCAC', division: 'Division III' },
            { name: 'New England Women\'s and Men\'s Athletic Conference', abbrev: 'NEWMAC', division: 'Division III' },
            { name: 'New Jersey Athletic Conference', abbrev: 'NJAC', division: 'Division III' },
            { name: 'North Atlantic Conference', abbrev: 'NAC', division: 'Division III' },
            { name: 'North Coast Athletic Conference', abbrev: 'NCAC', division: 'Division III' },
            { name: 'Northern Athletics Collegiate Conference', abbrev: 'NACC', division: 'Division III' },
            { name: 'Northwest Conference', abbrev: 'NWC', division: 'Division III' },
            { name: 'Ohio Athletic Conference', abbrev: 'OAC', division: 'Division III' },
            { name: 'Old Dominion Athletic Conference', abbrev: 'ODAC', division: 'Division III' },
            { name: 'Presidents\' Athletic Conference', abbrev: 'PAC', division: 'Division III' },
            { name: 'St. Louis Intercollegiate Athletic Conference', abbrev: 'SLIAC', division: 'Division III' },
            { name: 'Skyline Conference', abbrev: 'Skyline', division: 'Division III' },
            { name: 'Southern Athletic Association', abbrev: 'SAA', division: 'Division III' },
            { name: 'Southern California Intercollegiate Athletic Conference', abbrev: 'SCIAC', division: 'Division III' },
            { name: 'Southern Collegiate Athletic Conference', abbrev: 'SCAC', division: 'Division III' },
            { name: 'State University of New York Athletic Conference', abbrev: 'SUNYAC', division: 'Division III' },
            { name: 'United East Conference', abbrev: 'UEC', division: 'Division III' },
            { name: 'University Athletic Association', abbrev: 'UAA', division: 'Division III' },
            { name: 'Upper Midwest Athletic Conference', abbrev: 'UMAC', division: 'Division III' },
            { name: 'USA South Athletic Conference', abbrev: 'USA South', division: 'Division III' },
            { name: 'Wisconsin Intercollegiate Athletic Conference', abbrev: 'WIAC', division: 'Division III' },
            { name: 'Eastern Collegiate Football Conference', abbrev: 'ECFC', division: 'Division III' },
            { name: 'Allegheny Mountain Collegiate Conference', abbrev: 'AMCC', division: 'Division III' },
            { name: 'Division III Independent', abbrev: 'D3-Ind', division: 'Division III' }, 

            // NAIA Conferences
            { name: 'Heart of America Athletic Conference', abbrev: 'HAAC', division: 'NAIA' },
            { name: 'Kansas Collegiate Athletic Conference', abbrev: 'KCAC', division: 'NAIA' },

            // International
            { name: 'U Sports', abbrev: 'USPORTS', division: 'International' },

            // No Conference
            { name: 'No Conference', abbrev: 'NONE', division: 'No Division' }
        ];

        for (const conf of collegeConferences) {
            await client.query(`
                INSERT INTO conference (conference_name, conference_abbreviation, division_id)
                VALUES ($1, $2, (SELECT division_id FROM division WHERE division_name = $3))
                ON CONFLICT (conference_name) DO NOTHING
            `, [conf.name, conf.abbrev, conf.division]);
        }

                // FBS Colleges
        const fbsColleges = [
            // American Athletic Conference
            { name: 'Army', conference: 'American Athletic Conference', mascot: 'Black Knights', primaryColor: '#000000', secondaryColor: '#D4BF91' },
            { name: 'Charlotte', conference: 'American Athletic Conference', mascot: '49ers', primaryColor: '#046A38', secondaryColor: '#B9975B' },
            { name: 'East Carolina', conference: 'American Athletic Conference', mascot: 'Pirates', primaryColor: '#592A8A', secondaryColor: '#FDC82F' },
            { name: 'Florida Atlantic', conference: 'American Athletic Conference', mascot: 'Owls', primaryColor: '#003366', secondaryColor: '#CC0000' },
            { name: 'Memphis', conference: 'American Athletic Conference', mascot: 'Tigers', primaryColor: '#003087', secondaryColor: '#898D8D' },
            { name: 'Navy', conference: 'American Athletic Conference', mascot: 'Midshipmen', primaryColor: '#00205B', secondaryColor: '#C5B783' },
            { name: 'North Texas', conference: 'American Athletic Conference', mascot: 'Mean Green', primaryColor: '#00853E', secondaryColor: '#000000' },
            { name: 'Rice', conference: 'American Athletic Conference', mascot: 'Owls', primaryColor: '#00205B', secondaryColor: '#C1C6C8' },
            { name: 'South Florida', conference: 'American Athletic Conference', mascot: 'Bulls', primaryColor: '#006747', secondaryColor: '#CFC493' },
            { name: 'Temple', conference: 'American Athletic Conference', mascot: 'Owls', primaryColor: '#9D2235', secondaryColor: '#000000' },
            { name: 'Tulane', conference: 'American Athletic Conference', mascot: 'Green Wave', primaryColor: '#006747', secondaryColor: '#418FDE' },
            { name: 'Tulsa', conference: 'American Athletic Conference', mascot: 'Golden Hurricane', primaryColor: '#002D72', secondaryColor: '#C8102E' },
            { name: 'UAB', conference: 'American Athletic Conference', mascot: 'Blazers', primaryColor: '#1E6B52', secondaryColor: '#F4C300' },
            { name: 'UTSA', conference: 'American Athletic Conference', mascot: 'Roadrunners', primaryColor: '#F15A22', secondaryColor: '#002A5C' },

            // Atlantic Coast Conference
            { name: 'Boston College', conference: 'Atlantic Coast Conference', mascot: 'Eagles', primaryColor: '#98002E', secondaryColor: '#BC9B6A' },
            { name: 'California', conference: 'Atlantic Coast Conference', mascot: 'Golden Bears', primaryColor: '#003262', secondaryColor: '#FDB515' },
            { name: 'Clemson', conference: 'Atlantic Coast Conference', mascot: 'Tigers', primaryColor: '#F56600', secondaryColor: '#522D80' },
            { name: 'Duke', conference: 'Atlantic Coast Conference', mascot: 'Blue Devils', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Florida State', conference: 'Atlantic Coast Conference', mascot: 'Seminoles', primaryColor: '#782F40', secondaryColor: '#CEB888' },
            { name: 'Georgia Tech', conference: 'Atlantic Coast Conference', mascot: 'Yellow Jackets', primaryColor: '#B3A369', secondaryColor: '#003057' },
            { name: 'Louisville', conference: 'Atlantic Coast Conference', mascot: 'Cardinals', primaryColor: '#AD0000', secondaryColor: '#000000' },
            { name: 'Miami', conference: 'Atlantic Coast Conference', mascot: 'Hurricanes', primaryColor: '#F47321', secondaryColor: '#005030' },
            { name: 'North Carolina', conference: 'Atlantic Coast Conference', mascot: 'Tar Heels', primaryColor: '#7BAFD4', secondaryColor: '#FFFFFF' },
            { name: 'NC State', conference: 'Atlantic Coast Conference', mascot: 'Wolfpack', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Pittsburgh', conference: 'Atlantic Coast Conference', mascot: 'Panthers', primaryColor: '#003594', secondaryColor: '#FFB81C' },
            { name: 'SMU', conference: 'Atlantic Coast Conference', mascot: 'Mustangs', primaryColor: '#0033A0', secondaryColor: '#C8102E' },
            { name: 'Stanford', conference: 'Atlantic Coast Conference', mascot: 'Cardinal', primaryColor: '#8C1515', secondaryColor: '#FFFFFF' },
            { name: 'Syracuse', conference: 'Atlantic Coast Conference', mascot: 'Orange', primaryColor: '#F76900', secondaryColor: '#000000' },
            { name: 'Virginia', conference: 'Atlantic Coast Conference', mascot: 'Cavaliers', primaryColor: '#232D4B', secondaryColor: '#F84C1E' },
            { name: 'Virginia Tech', conference: 'Atlantic Coast Conference', mascot: 'Hokies', primaryColor: '#630031', secondaryColor: '#CF4420' },
            { name: 'Wake Forest', conference: 'Atlantic Coast Conference', mascot: 'Demon Deacons', primaryColor: '#9E7E38', secondaryColor: '#000000' },

            // Big 12 Conference
            { name: 'Arizona', conference: 'Big 12 Conference', mascot: 'Wildcats', primaryColor: '#CC0033', secondaryColor: '#003366' },
            { name: 'Arizona State', conference: 'Big 12 Conference', mascot: 'Sun Devils', primaryColor: '#8C1D40', secondaryColor: '#FFC627' },
            { name: 'Baylor', conference: 'Big 12 Conference', mascot: 'Bears', primaryColor: '#003015', secondaryColor: '#FFB81C' },
            { name: 'BYU', conference: 'Big 12 Conference', mascot: 'Cougars', primaryColor: '#002E5D', secondaryColor: '#FFFFFF' },
            { name: 'Cincinnati', conference: 'Big 12 Conference', mascot: 'Bearcats', primaryColor: '#000000', secondaryColor: '#E00122' },
            { name: 'Colorado', conference: 'Big 12 Conference', mascot: 'Buffaloes', primaryColor: '#CFB87C', secondaryColor: '#000000' },
            { name: 'Houston', conference: 'Big 12 Conference', mascot: 'Cougars', primaryColor: '#C8102E', secondaryColor: '#B2B4B2' },
            { name: 'Iowa State', conference: 'Big 12 Conference', mascot: 'Cyclones', primaryColor: '#C8102E', secondaryColor: '#F1BE48' },
            { name: 'Kansas', conference: 'Big 12 Conference', mascot: 'Jayhawks', primaryColor: '#0051BA', secondaryColor: '#E8000D' },
            { name: 'Kansas State', conference: 'Big 12 Conference', mascot: 'Wildcats', primaryColor: '#512888', secondaryColor: '#A7A7A7' },
            { name: 'Oklahoma State', conference: 'Big 12 Conference', mascot: 'Cowboys', primaryColor: '#FF7300', secondaryColor: '#000000' },
            { name: 'TCU', conference: 'Big 12 Conference', mascot: 'Horned Frogs', primaryColor: '#4D1979', secondaryColor: '#A3A9AC' },
            { name: 'Texas Tech', conference: 'Big 12 Conference', mascot: 'Red Raiders', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'UCF', conference: 'Big 12 Conference', mascot: 'Knights', primaryColor: '#000000', secondaryColor: '#BA9B37' },
            { name: 'Utah', conference: 'Big 12 Conference', mascot: 'Utes', primaryColor: '#CC0000', secondaryColor: '#808080' },
            { name: 'West Virginia', conference: 'Big 12 Conference', mascot: 'Mountaineers', primaryColor: '#002855', secondaryColor: '#EAAA00' },

            // Big Ten Conference
            { name: 'Illinois', conference: 'Big Ten Conference', mascot: 'Fighting Illini', primaryColor: '#E84A27', secondaryColor: '#13294B' },
            { name: 'Indiana', conference: 'Big Ten Conference', mascot: 'Hoosiers', primaryColor: '#990000', secondaryColor: '#FFFFFF' },
            { name: 'Iowa', conference: 'Big Ten Conference', mascot: 'Hawkeyes', primaryColor: '#000000', secondaryColor: '#FFCD00' },
            { name: 'Maryland', conference: 'Big Ten Conference', mascot: 'Terrapins', primaryColor: '#E03a3e', secondaryColor: '#FFD520' },
            { name: 'Michigan', conference: 'Big Ten Conference', mascot: 'Wolverines', primaryColor: '#00274C', secondaryColor: '#FFCB05' },
            { name: 'Michigan State', conference: 'Big Ten Conference', mascot: 'Spartans', primaryColor: '#18453B', secondaryColor: '#FFFFFF' },
            { name: 'Minnesota', conference: 'Big Ten Conference', mascot: 'Golden Gophers', primaryColor: '#7A0019', secondaryColor: '#FFCC33' },
            { name: 'Nebraska', conference: 'Big Ten Conference', mascot: 'Cornhuskers', primaryColor: '#E41C38', secondaryColor: '#FFFFFF' },
            { name: 'Northwestern', conference: 'Big Ten Conference', mascot: 'Wildcats', primaryColor: '#4E2A84', secondaryColor: '#FFFFFF' },
            { name: 'Ohio State', conference: 'Big Ten Conference', mascot: 'Buckeyes', primaryColor: '#BB0000', secondaryColor: '#666666' },
            { name: 'Oregon', conference: 'Big Ten Conference', mascot: 'Ducks', primaryColor: '#154733', secondaryColor: '#FEE123' },
            { name: 'Penn State', conference: 'Big Ten Conference', mascot: 'Nittany Lions', primaryColor: '#041E42', secondaryColor: '#FFFFFF' },
            { name: 'Purdue', conference: 'Big Ten Conference', mascot: 'Boilermakers', primaryColor: '#CEB888', secondaryColor: '#000000' },
            { name: 'Rutgers', conference: 'Big Ten Conference', mascot: 'Scarlet Knights', primaryColor: '#CC0033', secondaryColor: '#000000' },
            { name: 'UCLA', conference: 'Big Ten Conference', mascot: 'Bruins', primaryColor: '#2D68C4', secondaryColor: '#F2A900' },
            { name: 'USC', conference: 'Big Ten Conference', mascot: 'Trojans', primaryColor: '#990000', secondaryColor: '#FFC72C' },
            { name: 'Washington', conference: 'Big Ten Conference', mascot: 'Huskies', primaryColor: '#4B2E83', secondaryColor: '#B7A57A' },
            { name: 'Wisconsin', conference: 'Big Ten Conference', mascot: 'Badgers', primaryColor: '#C5050C', secondaryColor: '#FFFFFF' },

            // Conference USA
            { name: 'FIU', conference: 'Conference USA', mascot: 'Panthers', primaryColor: '#081E3F', secondaryColor: '#B6862C' },
            { name: 'Jacksonville State', conference: 'Conference USA', mascot: 'Gamecocks', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Kennesaw State', conference: 'Conference USA', mascot: 'Owls', primaryColor: '#FDBB30', secondaryColor: '#000000' },
            { name: 'Liberty', conference: 'Conference USA', mascot: 'Flames', primaryColor: '#002D62', secondaryColor: '#C41230' },
            { name: 'Louisiana Tech', conference: 'Conference USA', mascot: 'Bulldogs', primaryColor: '#002F8B', secondaryColor: '#E31B23' },
            { name: 'Middle Tennessee', conference: 'Conference USA', mascot: 'Blue Raiders', primaryColor: '#0066CC', secondaryColor: '#000000' },
            { name: 'New Mexico State', conference: 'Conference USA', mascot: 'Aggies', primaryColor: '#8C0B42', secondaryColor: '#000000' },
            { name: 'Sam Houston', conference: 'Conference USA', mascot: 'Bearkats', primaryColor: '#F78F1E', secondaryColor: '#FFFFFF' },
            { name: 'UTEP', conference: 'Conference USA', mascot: 'Miners', primaryColor: '#FF8200', secondaryColor: '#041E42' },
            { name: 'Western Kentucky', conference: 'Conference USA', mascot: 'Hilltoppers', primaryColor: '#C60C30', secondaryColor: '#000000' },

            // Mid-American Conference
            { name: 'Akron', conference: 'Mid-American Conference', mascot: 'Zips', primaryColor: '#041E42', secondaryColor: '#A89968' },
            { name: 'Ball State', conference: 'Mid-American Conference', mascot: 'Cardinals', primaryColor: '#BA0C2F', secondaryColor: '#000000' },
            { name: 'Bowling Green', conference: 'Mid-American Conference', mascot: 'Falcons', primaryColor: '#FE5000', secondaryColor: '#4F2C1D' },
            { name: 'Buffalo', conference: 'Mid-American Conference', mascot: 'Bulls', primaryColor: '#005BBB', secondaryColor: '#000000' },
            { name: 'Central Michigan', conference: 'Mid-American Conference', mascot: 'Chippewas', primaryColor: '#6A0032', secondaryColor: '#FFC82E' },
            { name: 'Eastern Michigan', conference: 'Mid-American Conference', mascot: 'Eagles', primaryColor: '#006633', secondaryColor: '#000000' },
            { name: 'Kent State', conference: 'Mid-American Conference', mascot: 'Golden Flashes', primaryColor: '#002664', secondaryColor: '#EAAB00' },
            { name: 'Miami (OH)', conference: 'Mid-American Conference', mascot: 'RedHawks', primaryColor: '#B61E2E', secondaryColor: '#000000' },
            { name: 'Northern Illinois', conference: 'Mid-American Conference', mascot: 'Huskies', primaryColor: '#BA0C2F', secondaryColor: '#000000' },
            { name: 'Ohio', conference: 'Mid-American Conference', mascot: 'Bobcats', primaryColor: '#00694E', secondaryColor: '#CDA077' },
            { name: 'Toledo', conference: 'Mid-American Conference', mascot: 'Rockets', primaryColor: '#003E7E', secondaryColor: '#FFB20F' },
            { name: 'Western Michigan', conference: 'Mid-American Conference', mascot: 'Broncos', primaryColor: '#6C4023', secondaryColor: '#B5A167' },

            // Mountain West Conference
            { name: 'Air Force', conference: 'Mountain West Conference', mascot: 'Falcons', primaryColor: '#003087', secondaryColor: '#8A8D8F' },
            { name: 'Boise State', conference: 'Mountain West Conference', mascot: 'Broncos', primaryColor: '#0033A0', secondaryColor: '#D64309' },
            { name: 'Colorado State', conference: 'Mountain West Conference', mascot: 'Rams', primaryColor: '#1E4D2B', secondaryColor: '#C8C372' },
            { name: 'Fresno State', conference: 'Mountain West Conference', mascot: 'Bulldogs', primaryColor: '#DB0032', secondaryColor: '#002E6D' },
            { name: 'Hawaiʻi', conference: 'Mountain West Conference', mascot: 'Rainbow Warriors', primaryColor: '#024731', secondaryColor: '#C8C8C8' },
            { name: 'Nevada', conference: 'Mountain West Conference', mascot: 'Wolf Pack', primaryColor: '#003366', secondaryColor: '#807F84' },
            { name: 'New Mexico', conference: 'Mountain West Conference', mascot: 'Lobos', primaryColor: '#BA0C2F', secondaryColor: '#63666A' },
            { name: 'San Diego State', conference: 'Mountain West Conference', mascot: 'Aztecs', primaryColor: '#A6192E', secondaryColor: '#000000' },
            { name: 'San Jose State', conference: 'Mountain West Conference', mascot: 'Spartans', primaryColor: '#0055A2', secondaryColor: '#E5A823' },
            { name: 'UNLV', conference: 'Mountain West Conference', mascot: 'Rebels', primaryColor: '#CF0A2C', secondaryColor: '#000000' },
            { name: 'Utah State', conference: 'Mountain West Conference', mascot: 'Aggies', primaryColor: '#00263A', secondaryColor: '#8A8D8F' },
            { name: 'Wyoming', conference: 'Mountain West Conference', mascot: 'Cowboys', primaryColor: '#492F24', secondaryColor: '#FFC425' },

            // Pac-12 Conference
            { name: 'Oregon State', conference: 'Pac-12 Conference', mascot: 'Beavers', primaryColor: '#DC4405', secondaryColor: '#000000' },
            { name: 'Washington State', conference: 'Pac-12 Conference', mascot: 'Cougars', primaryColor: '#981E32', secondaryColor: '#5E6A71' },

            // Southeastern Conference
            { name: 'Alabama', conference: 'Southeastern Conference', mascot: 'Crimson Tide', primaryColor: '#9E1B32', secondaryColor: '#828A8F' },
            { name: 'Arkansas', conference: 'Southeastern Conference', mascot: 'Razorbacks', primaryColor: '#9D2235', secondaryColor: '#000000' },
            { name: 'Auburn', conference: 'Southeastern Conference', mascot: 'Tigers', primaryColor: '#0C2340', secondaryColor: '#E87722' },
            { name: 'Florida', conference: 'Southeastern Conference', mascot: 'Gators', primaryColor: '#0021A5', secondaryColor: '#FA4616' },
            { name: 'Georgia', conference: 'Southeastern Conference', mascot: 'Bulldogs', primaryColor: '#BA0C2F', secondaryColor: '#000000' },
            { name: 'Kentucky', conference: 'Southeastern Conference', mascot: 'Wildcats', primaryColor: '#0033A0', secondaryColor: '#FFFFFF' },
            { name: 'LSU', conference: 'Southeastern Conference', mascot: 'Tigers', primaryColor: '#461D7C', secondaryColor: '#FDD023' },
            { name: 'Mississippi State', conference: 'Southeastern Conference', mascot: 'Bulldogs', primaryColor: '#660000', secondaryColor: '#FFFFFF' },
            { name: 'Missouri', conference: 'Southeastern Conference', mascot: 'Tigers', primaryColor: '#F1B82D', secondaryColor: '#000000' },
            { name: 'Oklahoma', conference: 'Southeastern Conference', mascot: 'Sooners', primaryColor: '#841617', secondaryColor: '#FDF9D8' },
            { name: 'Ole Miss', conference: 'Southeastern Conference', mascot: 'Rebels', primaryColor: '#CE1126', secondaryColor: '#14213D' },
            { name: 'South Carolina', conference: 'Southeastern Conference', mascot: 'Gamecocks', primaryColor: '#73000A', secondaryColor: '#000000' },
            { name: 'Tennessee', conference: 'Southeastern Conference', mascot: 'Volunteers', primaryColor: '#FF8200', secondaryColor: '#58595B' },
            { name: 'Texas', conference: 'Southeastern Conference', mascot: 'Longhorns', primaryColor: '#BF5700', secondaryColor: '#FFFFFF' },
            { name: 'Texas A&M', conference: 'Southeastern Conference', mascot: 'Aggies', primaryColor: '#500000', secondaryColor: '#FFFFFF' },
            { name: 'Vanderbilt', conference: 'Southeastern Conference', mascot: 'Commodores', primaryColor: '#000000', secondaryColor: '#866D4B' },

            // Sun Belt Conference
            { name: 'Appalachian State', conference: 'Sun Belt Conference', mascot: 'Mountaineers', primaryColor: '#000000', secondaryColor: '#FFB700' },
            { name: 'Arkansas State', conference: 'Sun Belt Conference', mascot: 'Red Wolves', primaryColor: '#CC092F', secondaryColor: '#000000' },
            { name: 'Coastal Carolina', conference: 'Sun Belt Conference', mascot: 'Chanticleers', primaryColor: '#006F71', secondaryColor: '#A27752' },
            { name: 'Georgia Southern', conference: 'Sun Belt Conference', mascot: 'Eagles', primaryColor: '#041E42', secondaryColor: '#A28D5B' },
            { name: 'Georgia State', conference: 'Sun Belt Conference', mascot: 'Panthers', primaryColor: '#0039A6', secondaryColor: '#C60C30' },
            { name: 'James Madison', conference: 'Sun Belt Conference', mascot: 'Dukes', primaryColor: '#450084', secondaryColor: '#B5A36A' },
            { name: 'Louisiana', conference: 'Sun Belt Conference', mascot: 'Ragin\' Cajuns', primaryColor: '#CE181E', secondaryColor: '#0A0203' },
            { name: 'Louisiana–Monroe', conference: 'Sun Belt Conference', mascot: 'Warhawks', primaryColor: '#800029', secondaryColor: '#FFB300' },
            { name: 'Marshall', conference: 'Sun Belt Conference', mascot: 'Thundering Herd', primaryColor: '#00B140', secondaryColor: '#000000' },
            { name: 'Old Dominion', conference: 'Sun Belt Conference', mascot: 'Monarchs', primaryColor: '#003057', secondaryColor: '#A1D2F1' },
            { name: 'South Alabama', conference: 'Sun Belt Conference', mascot: 'Jaguars', primaryColor: '#00205B', secondaryColor: '#BA0C2F' },
            { name: 'Southern Miss', conference: 'Sun Belt Conference', mascot: 'Golden Eagles', primaryColor: '#000000', secondaryColor: '#FFB700' },
            { name: 'Texas State', conference: 'Sun Belt Conference', mascot: 'Bobcats', primaryColor: '#501214', secondaryColor: '#666666' },
            { name: 'Troy', conference: 'Sun Belt Conference', mascot: 'Trojans', primaryColor: '#8B2332', secondaryColor: '#C3C5C8' },

            // FBS Independents
            { name: 'Notre Dame', conference: 'FBS Independent', mascot: 'Fighting Irish', primaryColor: '#0C2340', secondaryColor: '#C99700' },
            { name: 'UConn', conference: 'FBS Independent', mascot: 'Huskies', primaryColor: '#000E2F', secondaryColor: '#E4002B' },
            { name: 'UMass', conference: 'FBS Independent', mascot: 'Minutemen', primaryColor: '#881C1C', secondaryColor: '#000000' },

            // Atlantic 10 Conference
            { name: 'Virginia Commonwealth', conference: 'Atlantic 10 Conference', mascot: 'Rams', primaryColor: '#000000', secondaryColor: '#FFB300' },

            // Metro Atlantic Athletic Conference
            { name: 'Canisius', conference: 'Metro Atlantic Athletic Conference', mascot: 'Golden Griffins', primaryColor: '#002664', secondaryColor: '#CEB888' },

            // Big Sky Conference
            { name: 'Cal Poly', conference: 'Big Sky Conference', mascot: 'Mustangs', primaryColor: '#154734', secondaryColor: '#C69214' },
            { name: 'Eastern Washington', conference: 'Big Sky Conference', mascot: 'Eagles', primaryColor: '#A10022', secondaryColor: '#000000' },
            { name: 'Idaho', conference: 'Big Sky Conference', mascot: 'Vandals', primaryColor: '#B3A369', secondaryColor: '#000000' },
            { name: 'Idaho State', conference: 'Big Sky Conference', mascot: 'Bengals', primaryColor: '#FF8400', secondaryColor: '#000000' },
            { name: 'Montana', conference: 'Big Sky Conference', mascot: 'Grizzlies', primaryColor: '#999999', secondaryColor: '#700027' },
            { name: 'Montana State', conference: 'Big Sky Conference', mascot: 'Bobcats', primaryColor: '#003875', secondaryColor: '#B9975B' },
            { name: 'Northern Arizona', conference: 'Big Sky Conference', mascot: 'Lumberjacks', primaryColor: '#003466', secondaryColor: '#FFC425' },
            { name: 'Northern Colorado', conference: 'Big Sky Conference', mascot: 'Bears', primaryColor: '#013C65', secondaryColor: '#FFC82E' },
            { name: 'Portland State', conference: 'Big Sky Conference', mascot: 'Vikings', primaryColor: '#154734', secondaryColor: '#FFFFFF' },
            { name: 'Sacramento State', conference: 'Big Sky Conference', mascot: 'Hornets', primaryColor: '#043927', secondaryColor: '#C4B581' },
            { name: 'UC Davis', conference: 'Big Sky Conference', mascot: 'Aggies', primaryColor: '#002855', secondaryColor: '#B3A369' },
            { name: 'Weber State', conference: 'Big Sky Conference', mascot: 'Wildcats', primaryColor: '#492365', secondaryColor: '#FFFFFF' },

            // Big South–OVC Football Association
            { name: 'Bryant', conference: 'Big South–OVC Football Association', mascot: 'Bulldogs', primaryColor: '#000000', secondaryColor: '#A89968' },
            { name: 'Charleston Southern', conference: 'Big South–OVC Football Association', mascot: 'Buccaneers', primaryColor: '#003087', secondaryColor: '#C5B783' },
            { name: 'Eastern Illinois', conference: 'Big South–OVC Football Association', mascot: 'Panthers', primaryColor: '#004B98', secondaryColor: '#9EA2A2' },
            { name: 'Gardner-Webb', conference: 'Big South–OVC Football Association', mascot: 'Runnin\' Bulldogs', primaryColor: '#BF2F37', secondaryColor: '#000000' },
            { name: 'Lindenwood', conference: 'Big South–OVC Football Association', mascot: 'Lions', primaryColor: '#000000', secondaryColor: '#CFB87C' },
            { name: 'Robert Morris', conference: 'Big South–OVC Football Association', mascot: 'Colonials', primaryColor: '#14234B', secondaryColor: '#A6192E' },
            { name: 'Southeast Missouri State', conference: 'Big South–OVC Football Association', mascot: 'Redhawks', primaryColor: '#C8102E', secondaryColor: '#000000' },
            { name: 'Tennessee State', conference: 'Big South–OVC Football Association', mascot: 'Tigers', primaryColor: '#00539F', secondaryColor: '#FFFFFF' },
            { name: 'Tennessee Tech', conference: 'Big South–OVC Football Association', mascot: 'Golden Eagles', primaryColor: '#4F2984', secondaryColor: '#FFB300' },
            { name: 'UT Martin', conference: 'Big South–OVC Football Association', mascot: 'Skyhawks', primaryColor: '#FF6B00', secondaryColor: '#000B8C' },
            { name: 'Western Illinois', conference: 'Big South–OVC Football Association', mascot: 'Leathernecks', primaryColor: '#663399', secondaryColor: '#FFC72C' },

            // CAA Football
            { name: 'Albany', conference: 'CAA Football', mascot: 'Great Danes', primaryColor: '#461660', secondaryColor: '#EEB211' },
            { name: 'Campbell', conference: 'CAA Football', mascot: 'Fighting Camels', primaryColor: '#F58025', secondaryColor: '#231F20' },
            { name: 'Delaware', conference: 'CAA Football', mascot: 'Blue Hens', primaryColor: '#00539F', secondaryColor: '#FFD200' },
            { name: 'Elon', conference: 'CAA Football', mascot: 'Phoenix', primaryColor: '#800000', secondaryColor: '#B3A369' },
            { name: 'Hampton', conference: 'CAA Football', mascot: 'Pirates', primaryColor: '#0067B1', secondaryColor: '#FFFFFF' },
            { name: 'Maine', conference: 'CAA Football', mascot: 'Black Bears', primaryColor: '#003263', secondaryColor: '#B0B7BC' },
            { name: 'Monmouth', conference: 'CAA Football', mascot: 'Hawks', primaryColor: '#041E42', secondaryColor: '#8B8B8B' },
            { name: 'New Hampshire', conference: 'CAA Football', mascot: 'Wildcats', primaryColor: '#003DA5', secondaryColor: '#FFFFFF' },
            { name: 'North Carolina A&T', conference: 'CAA Football', mascot: 'Aggies', primaryColor: '#004684', secondaryColor: '#F7B722' },
            { name: 'Rhode Island', conference: 'CAA Football', mascot: 'Rams', primaryColor: '#002147', secondaryColor: '#75B2DD' },
            { name: 'Richmond', conference: 'CAA Football', mascot: 'Spiders', primaryColor: '#990000', secondaryColor: '#000066' },
            { name: 'Stony Brook', conference: 'CAA Football', mascot: 'Seawolves', primaryColor: '#990000', secondaryColor: '#16243E' },
            { name: 'Towson', conference: 'CAA Football', mascot: 'Tigers', primaryColor: '#FFB81C', secondaryColor: '#000000' },
            { name: 'Villanova', conference: 'CAA Football', mascot: 'Wildcats', primaryColor: '#00205B', secondaryColor: '#13B5EA' },
            { name: 'William & Mary', conference: 'CAA Football', mascot: 'Tribe', primaryColor: '#115740', secondaryColor: '#B9975B' },

            // Ivy League
            { name: 'Brown', conference: 'Ivy League', mascot: 'Bears', primaryColor: '#4E3629', secondaryColor: '#C00000' },
            { name: 'Columbia', conference: 'Ivy League', mascot: 'Lions', primaryColor: '#9BCBEB', secondaryColor: '#FFFFFF' },
            { name: 'Cornell', conference: 'Ivy League', mascot: 'Big Red', primaryColor: '#B31B1B', secondaryColor: '#FFFFFF' },
            { name: 'Dartmouth', conference: 'Ivy League', mascot: 'Big Green', primaryColor: '#00693E', secondaryColor: '#FFFFFF' },
            { name: 'Harvard', conference: 'Ivy League', mascot: 'Crimson', primaryColor: '#A51C30', secondaryColor: '#000000' },
            { name: 'Penn', conference: 'Ivy League', mascot: 'Quakers', primaryColor: '#011F5B', secondaryColor: '#990000' },
            { name: 'Princeton', conference: 'Ivy League', mascot: 'Tigers', primaryColor: '#FF8F00', secondaryColor: '#000000' },
            { name: 'Yale', conference: 'Ivy League', mascot: 'Bulldogs', primaryColor: '#00356B', secondaryColor: '#FFFFFF' },

            // Mid-Eastern Athletic Conference (MEAC)
            { name: 'Delaware State', conference: 'Mid-Eastern Athletic Conference', mascot: 'Hornets', primaryColor: '#C41230', secondaryColor: '#1E4496' },
            { name: 'Howard', conference: 'Mid-Eastern Athletic Conference', mascot: 'Bison', primaryColor: '#003A63', secondaryColor: '#E51937' },
            { name: 'Morgan State', conference: 'Mid-Eastern Athletic Conference', mascot: 'Bears', primaryColor: '#F47937', secondaryColor: '#0033A0' },
            { name: 'Norfolk State', conference: 'Mid-Eastern Athletic Conference', mascot: 'Spartans', primaryColor: '#007A53', secondaryColor: '#F3D03E' },
            { name: 'North Carolina Central', conference: 'Mid-Eastern Athletic Conference', mascot: 'Eagles', primaryColor: '#8A1538', secondaryColor: '#898D8D' },
            { name: 'South Carolina State', conference: 'Mid-Eastern Athletic Conference', mascot: 'Bulldogs', primaryColor: '#841A2B', secondaryColor: '#1E4496' },

            // Missouri Valley Football Conference
            { name: 'Illinois State', conference: 'Missouri Valley Football Conference', mascot: 'Redbirds', primaryColor: '#CE1126', secondaryColor: '#000000' },
            { name: 'Indiana State', conference: 'Missouri Valley Football Conference', mascot: 'Sycamores', primaryColor: '#00669A', secondaryColor: '#FFFFFF' },
            { name: 'Murray State', conference: 'Missouri Valley Football Conference', mascot: 'Racers', primaryColor: '#002144', secondaryColor: '#FDB826' },
            { name: 'Missouri State', conference: 'Missouri Valley Football Conference', mascot: 'Bears', primaryColor: '#5F0000', secondaryColor: '#000000' },
            { name: 'North Dakota', conference: 'Missouri Valley Football Conference', mascot: 'Fighting Hawks', primaryColor: '#009A44', secondaryColor: '#000000' },
            { name: 'North Dakota State', conference: 'Missouri Valley Football Conference', mascot: 'Bison', primaryColor: '#0A5640', secondaryColor: '#FFC72C' },
            { name: 'Northern Iowa', conference: 'Missouri Valley Football Conference', mascot: 'Panthers', primaryColor: '#4B116F', secondaryColor: '#FFB81C' },
            { name: 'South Dakota', conference: 'Missouri Valley Football Conference', mascot: 'Coyotes', primaryColor: '#CD1241', secondaryColor: '#000000' },
            { name: 'South Dakota State', conference: 'Missouri Valley Football Conference', mascot: 'Jackrabbits', primaryColor: '#0033A0', secondaryColor: '#FFB81C' },
            { name: 'Southern Illinois', conference: 'Missouri Valley Football Conference', mascot: 'Salukis', primaryColor: '#720000', secondaryColor: '#000000' },
            { name: 'Western Illinois', conference: 'Missouri Valley Football Conference', mascot: 'Leathernecks', primaryColor: '#663399', secondaryColor: '#FFC72C' },
            { name: 'Youngstown State', conference: 'Missouri Valley Football Conference', mascot: 'Penguins', primaryColor: '#C41230', secondaryColor: '#000000' },
            // Northeast Conference (NEC)
            { name: 'Central Connecticut', conference: 'Northeast Conference', mascot: 'Blue Devils', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Duquesne', conference: 'Northeast Conference', mascot: 'Dukes', primaryColor: '#041E42', secondaryColor: '#BA0C2F' },
            { name: 'LIU', conference: 'Northeast Conference', mascot: 'Sharks', primaryColor: '#00529B', secondaryColor: '#FFB81C' },
            { name: 'Merrimack', conference: 'Northeast Conference', mascot: 'Warriors', primaryColor: '#003595', secondaryColor: '#FDB913' },
            { name: 'Sacred Heart', conference: 'Northeast Conference', mascot: 'Pioneers', primaryColor: '#CE1141', secondaryColor: '#808080' },
            { name: 'St. Francis (PA)', conference: 'Northeast Conference', mascot: 'Red Flash', primaryColor: '#D21242', secondaryColor: '#000000' },
            { name: 'Stonehill', conference: 'Northeast Conference', mascot: 'Skyhawks', primaryColor: '#461B7E', secondaryColor: '#FFFFFF' },
            { name: 'Wagner', conference: 'Northeast Conference', mascot: 'Seahawks', primaryColor: '#00483A', secondaryColor: '#FFFFFF' },

            // Patriot League
            { name: 'Bucknell', conference: 'Patriot League', mascot: 'Bison', primaryColor: '#003865', secondaryColor: '#EC4812' },
            { name: 'Colgate', conference: 'Patriot League', mascot: 'Raiders', primaryColor: '#821019', secondaryColor: '#000000' },
            { name: 'Fordham', conference: 'Patriot League', mascot: 'Rams', primaryColor: '#860038', secondaryColor: '#FFFFFF' },
            { name: 'Georgetown', conference: 'Patriot League', mascot: 'Hoyas', primaryColor: '#041E42', secondaryColor: '#8D817B' },
            { name: 'Holy Cross', conference: 'Patriot League', mascot: 'Crusaders', primaryColor: '#602D89', secondaryColor: '#FFFFFF' },
            { name: 'Lafayette', conference: 'Patriot League', mascot: 'Leopards', primaryColor: '#98012E', secondaryColor: '#000000' },
            { name: 'Lehigh', conference: 'Patriot League', mascot: 'Mountain Hawks', primaryColor: '#653600', secondaryColor: '#FFFFFF' },

            // Pioneer Football League
            { name: 'Butler', conference: 'Pioneer Football League', mascot: 'Bulldogs', primaryColor: '#13294B', secondaryColor: '#747678' },
            { name: 'Davidson', conference: 'Pioneer Football League', mascot: 'Wildcats', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Dayton', conference: 'Pioneer Football League', mascot: 'Flyers', primaryColor: '#CE1141', secondaryColor: '#004B8D' },
            { name: 'Drake', conference: 'Pioneer Football League', mascot: 'Bulldogs', primaryColor: '#004477', secondaryColor: '#FFFFFF' },
            { name: 'Marist', conference: 'Pioneer Football League', mascot: 'Red Foxes', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
            { name: 'Morehead State', conference: 'Pioneer Football League', mascot: 'Eagles', primaryColor: '#0033A0', secondaryColor: '#FFB81C' },
            { name: 'Presbyterian', conference: 'Pioneer Football League', mascot: 'Blue Hose', primaryColor: '#0060A9', secondaryColor: '#96172E' },
            { name: 'San Diego', conference: 'Pioneer Football League', mascot: 'Toreros', primaryColor: '#003CA1', secondaryColor: '#98999B' },
            { name: 'St. Thomas (MN)', conference: 'Pioneer Football League', mascot: 'Tommies', primaryColor: '#512D6D', secondaryColor: '#959595' },
            { name: 'Stetson', conference: 'Pioneer Football League', mascot: 'Hatters', primaryColor: '#006747', secondaryColor: '#FFFFFF' },
            { name: 'Valparaiso', conference: 'Pioneer Football League', mascot: 'Beacons', primaryColor: '#613318', secondaryColor: '#FFC907' },

            // Southern Conference (SoCon)
            { name: 'Chattanooga', conference: 'Southern Conference', mascot: 'Mocs', primaryColor: '#00386B', secondaryColor: '#E0AA0F' },
            { name: 'The Citadel', conference: 'Southern Conference', mascot: 'Bulldogs', primaryColor: '#002B5C', secondaryColor: '#C90E3D' },
            { name: 'East Tennessee State', conference: 'Southern Conference', mascot: 'Buccaneers', primaryColor: '#041E42', secondaryColor: '#FFC72C' },
            { name: 'Furman', conference: 'Southern Conference', mascot: 'Paladins', primaryColor: '#582C83', secondaryColor: '#FFFFFF' },
            { name: 'Mercer', conference: 'Southern Conference', mascot: 'Bears', primaryColor: '#F36E1F', secondaryColor: '#000000' },
            { name: 'Samford', conference: 'Southern Conference', mascot: 'Bulldogs', primaryColor: '#002649', secondaryColor: '#C41230' },
            { name: 'VMI', conference: 'Southern Conference', mascot: 'Keydets', primaryColor: '#C8102E', secondaryColor: '#FDB913' },
            { name: 'Western Carolina', conference: 'Southern Conference', mascot: 'Catamounts', primaryColor: '#592C88', secondaryColor: '#C8922C' },
            { name: 'Wofford', conference: 'Southern Conference', mascot: 'Terriers', primaryColor: '#846F51', secondaryColor: '#000000' },

            // Southland Conference
            { name: 'Houston Christian', conference: 'Southland Conference', mascot: 'Huskies', primaryColor: '#FF6B00', secondaryColor: '#004B8D' },
            { name: 'Incarnate Word', conference: 'Southland Conference', mascot: 'Cardinals', primaryColor: '#CE0043', secondaryColor: '#000000' },
            { name: 'Lamar', conference: 'Southland Conference', mascot: 'Cardinals', primaryColor: '#ED1B2E', secondaryColor: '#00529B' },
            { name: 'McNeese', conference: 'Southland Conference', mascot: 'Cowboys', primaryColor: '#00529C', secondaryColor: '#FFD204' },
            { name: 'Nicholls', conference: 'Southland Conference', mascot: 'Colonels', primaryColor: '#AE132A', secondaryColor: '#231F20' },
            { name: 'Northwestern State', conference: 'Southland Conference', mascot: 'Demons', primaryColor: '#492F91', secondaryColor: '#F7941E' },
            { name: 'Southeastern Louisiana', conference: 'Southland Conference', mascot: 'Lions', primaryColor: '#006641', secondaryColor: '#FDD023' },
            { name: 'Texas A&M-Commerce', conference: 'Southland Conference', mascot: 'Lions', primaryColor: '#002D41', secondaryColor: '#FFC20E' },

            // Southwestern Athletic Conference (SWAC)
            { name: 'Alabama A&M', conference: 'Southwestern Athletic Conference', mascot: 'Bulldogs', primaryColor: '#660000', secondaryColor: '#FFFFFF' },
            { name: 'Alabama State', conference: 'Southwestern Athletic Conference', mascot: 'Hornets', primaryColor: '#000000', secondaryColor: '#CFB53B' },
            { name: 'Alcorn State', conference: 'Southwestern Athletic Conference', mascot: 'Braves', primaryColor: '#461D7C', secondaryColor: '#916F27' },
            { name: 'Arkansas–Pine Bluff', conference: 'Southwestern Athletic Conference', mascot: 'Golden Lions', primaryColor: '#000000', secondaryColor: '#FDB913' },
            { name: 'Bethune–Cookman', conference: 'Southwestern Athletic Conference', mascot: 'Wildcats', primaryColor: '#841B35', secondaryColor: '#FDB927' },
            { name: 'Florida A&M', conference: 'Southwestern Athletic Conference', mascot: 'Rattlers', primaryColor: '#FF7F3F', secondaryColor: '#006F41' },
            { name: 'Grambling State', conference: 'Southwestern Athletic Conference', mascot: 'Tigers', primaryColor: '#000000', secondaryColor: '#F3BC2C' },
            { name: 'Jackson State', conference: 'Southwestern Athletic Conference', mascot: 'Tigers', primaryColor: '#002147', secondaryColor: '#E31837' },
            { name: 'Mississippi Valley State', conference: 'Southwestern Athletic Conference', mascot: 'Delta Devils', primaryColor: '#007A5E', secondaryColor: '#FFFFFF' },
            { name: 'Prairie View A&M', conference: 'Southwestern Athletic Conference', mascot: 'Panthers', primaryColor: '#4F2D7F', secondaryColor: '#FFB81C' },
            { name: 'Southern', conference: 'Southwestern Athletic Conference', mascot: 'Jaguars', primaryColor: '#0033A0', secondaryColor: '#FFB81C' },
            { name: 'Texas Southern', conference: 'Southwestern Athletic Conference', mascot: 'Tigers', primaryColor: '#8B0000', secondaryColor: '#FFFFFF' },

            // United Athletic Conference (UAC)
            { name: 'Abilene Christian', conference: 'United Athletic Conference', mascot: 'Wildcats', primaryColor: '#461D7C', secondaryColor: '#FFFFFF' },
            { name: 'Austin Peay', conference: 'United Athletic Conference', mascot: 'Governors', primaryColor: '#C41E3A', secondaryColor: '#000000' },
            { name: 'Central Arkansas', conference: 'United Athletic Conference', mascot: 'Bears', primaryColor: '#4F2D7F', secondaryColor: '#969696' },
            { name: 'Eastern Kentucky', conference: 'United Athletic Conference', mascot: 'Colonels', primaryColor: '#861F41', secondaryColor: '#FFFFFF' },
            { name: 'North Alabama', conference: 'United Athletic Conference', mascot: 'Lions', primaryColor: '#46166B', secondaryColor: '#DB9F11' },
            { name: 'Southern Utah', conference: 'United Athletic Conference', mascot: 'Thunderbirds', primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
            { name: 'Stephen F. Austin', conference: 'United Athletic Conference', mascot: 'Lumberjacks', primaryColor: '#330066', secondaryColor: '#FFFFFF' },
            { name: 'Tarleton State', conference: 'United Athletic Conference', mascot: 'Texans', primaryColor: '#582C83', secondaryColor: '#FFFFFF' },
            { name: 'Utah Tech', conference: 'United Athletic Conference', mascot: 'Trailblazers', primaryColor: '#BA0C2F', secondaryColor: '#0075BE' },
            { name: 'West Georgia', conference: 'United Athletic Conference', mascot: 'Wolves', primaryColor: '#002D72', secondaryColor: '#E31837' },

            // Central Intercollegiate Athletic Association (CIAA)
            { name: 'Bowie State', conference: 'Central Intercollegiate Athletic Association', mascot: 'Bulldogs', primaryColor: '#000000', secondaryColor: '#F7B334' },
            { name: 'Chowan', conference: 'Central Intercollegiate Athletic Association', mascot: 'Hawks', primaryColor: '#0047BA', secondaryColor: '#FFFFFF' },
            { name: 'Elizabeth City State', conference: 'Central Intercollegiate Athletic Association', mascot: 'Vikings', primaryColor: '#0C2340', secondaryColor: '#A7A8AA' },
            { name: 'Fayetteville State', conference: 'Central Intercollegiate Athletic Association', mascot: 'Broncos', primaryColor: '#00235D', secondaryColor: '#FFFFFF' },
            { name: 'Johnson C. Smith', conference: 'Central Intercollegiate Athletic Association', mascot: 'Golden Bulls', primaryColor: '#B59B28', secondaryColor: '#0C2340' },
            { name: 'Lincoln (PA)', conference: 'Central Intercollegiate Athletic Association', mascot: 'Lions', primaryColor: '#FF7900', secondaryColor: '#00447C' },
            { name: 'Livingstone', conference: 'Central Intercollegiate Athletic Association', mascot: 'Blue Bears', primaryColor: '#0C4DA2', secondaryColor: '#000000' },
            { name: 'Saint Augustine\'s', conference: 'Central Intercollegiate Athletic Association', mascot: 'Falcons', primaryColor: '#002D72', secondaryColor: '#9D2235' },
            { name: 'Shaw', conference: 'Central Intercollegiate Athletic Association', mascot: 'Bears', primaryColor: '#862633', secondaryColor: '#FFFFFF' },
            { name: 'Virginia State', conference: 'Central Intercollegiate Athletic Association', mascot: 'Trojans', primaryColor: '#FF8200', secondaryColor: '#004B8D' },
            { name: 'Virginia Union', conference: 'Central Intercollegiate Athletic Association', mascot: 'Panthers', primaryColor: '#751C24', secondaryColor: '#FFFFFF' },
            { name: 'Winston-Salem State', conference: 'Central Intercollegiate Athletic Association', mascot: 'Rams', primaryColor: '#CE1126', secondaryColor: '#FFFFFF' },

            // Great American Conference (GAC)
            { name: 'Arkansas Tech', conference: 'Great American Conference', mascot: 'Wonder Boys', primaryColor: '#00563F', secondaryColor: '#FFB81C' },
            { name: 'East Central', conference: 'Great American Conference', mascot: 'Tigers', primaryColor: '#FF7900', secondaryColor: '#000000' },
            { name: 'Harding', conference: 'Great American Conference', mascot: 'Bisons', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Henderson State', conference: 'Great American Conference', mascot: 'Reddies', primaryColor: '#E31837', secondaryColor: '#808080' },
            { name: 'Northwestern Oklahoma State', conference: 'Great American Conference', mascot: 'Rangers', primaryColor: '#C8102E', secondaryColor: '#000000' },
            { name: 'Oklahoma Baptist', conference: 'Great American Conference', mascot: 'Bison', primaryColor: '#006341', secondaryColor: '#FFB81C' },
            { name: 'Ouachita Baptist', conference: 'Great American Conference', mascot: 'Tigers', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Southeastern Oklahoma State', conference: 'Great American Conference', mascot: 'Savage Storm', primaryColor: '#0033A0', secondaryColor: '#FFB81C' },
            { name: 'Southern Arkansas', conference: 'Great American Conference', mascot: 'Muleriders', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Southwestern Oklahoma State', conference: 'Great American Conference', mascot: 'Bulldogs', primaryColor: '#003087', secondaryColor: '#999999' },

            // Great Lakes Intercollegiate Athletic Conference (GLIAC)
            { name: 'Davenport', conference: 'Great Lakes Intercollegiate Athletic Conference', mascot: 'Panthers', primaryColor: '#BA0C2F', secondaryColor: '#000000' },
            { name: 'Ferris State', conference: 'Great Lakes Intercollegiate Athletic Conference', mascot: 'Bulldogs', primaryColor: '#BA0C2F', secondaryColor: '#FFB81C' },
            { name: 'Grand Valley State', conference: 'Great Lakes Intercollegiate Athletic Conference', mascot: 'Lakers', primaryColor: '#0033A0', secondaryColor: '#000000' },
            { name: 'Michigan Tech', conference: 'Great Lakes Intercollegiate Athletic Conference', mascot: 'Huskies', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Northern Michigan', conference: 'Great Lakes Intercollegiate Athletic Conference', mascot: 'Wildcats', primaryColor: '#00B140', secondaryColor: '#FFB81C' },
            { name: 'Roosevelt', conference: 'Great Lakes Intercollegiate Athletic Conference', mascot: 'Lakers', primaryColor: '#00843D', secondaryColor: '#FFB81C' },
            { name: 'Saginaw Valley State', conference: 'Great Lakes Intercollegiate Athletic Conference', mascot: 'Cardinals', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Wayne State', conference: 'Great Lakes Intercollegiate Athletic Conference', mascot: 'Warriors', primaryColor: '#0C2340', secondaryColor: '#FFB81C' },

            // Great Lakes Valley Conference (GLVC)
            { name: 'McKendree', conference: 'Great Lakes Valley Conference', mascot: 'Bearcats', primaryColor: '#4B116F', secondaryColor: '#FFC82E' },
            { name: 'Quincy', conference: 'Great Lakes Valley Conference', mascot: 'Hawks', primaryColor: '#00563F', secondaryColor: '#8A8D8F' },
            { name: 'Southwest Baptist', conference: 'Great Lakes Valley Conference', mascot: 'Bearcats', primaryColor: '#461D7C', secondaryColor: '#FFFFFF' },
            { name: 'Truman State', conference: 'Great Lakes Valley Conference', mascot: 'Bulldogs', primaryColor: '#482D6D', secondaryColor: '#FFFFFF' },
            { name: 'Indianapolis', conference: 'Great Lakes Valley Conference', mascot: 'Greyhounds', primaryColor: '#C8102E', secondaryColor: '#9EA2A2' },
            { name: 'Missouri S&T', conference: 'Great Lakes Valley Conference', mascot: 'Miners', primaryColor: '#003B49', secondaryColor: '#8A8D8F' },
            { name: 'William Jewell', conference: 'Great Lakes Valley Conference', mascot: 'Cardinals', primaryColor: '#C8102E', secondaryColor: '#000000' },

            // Great Northwest Athletic Conference (GNAC)
            { name: 'Cal Poly Humboldt', conference: 'Great Northwest Athletic Conference', mascot: 'Lumberjacks', primaryColor: '#046A38', secondaryColor: '#FFB81C' },

            // Great Midwest Athletic Conference (GMAC)
            { name: 'Ashland', conference: 'Great Midwest Athletic Conference', mascot: 'Eagles', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Findlay', conference: 'Great Midwest Athletic Conference', mascot: 'Oilers', primaryColor: '#FF7900', secondaryColor: '#000000' },
            { name: 'Hillsdale', conference: 'Great Midwest Athletic Conference', mascot: 'Chargers', primaryColor: '#0033A0', secondaryColor: '#FFFFFF' },
            { name: 'Kentucky Wesleyan', conference: 'Great Midwest Athletic Conference', mascot: 'Panthers', primaryColor: '#4B2682', secondaryColor: '#000000' },
            { name: 'Lake Erie', conference: 'Great Midwest Athletic Conference', mascot: 'Storm', primaryColor: '#00594C', secondaryColor: '#7C878E' },
            { name: 'Malone', conference: 'Great Midwest Athletic Conference', mascot: 'Pioneers', primaryColor: '#231F20', secondaryColor: '#BE1E2D' },
            { name: 'Ohio Dominican', conference: 'Great Midwest Athletic Conference', mascot: 'Panthers', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Tiffin', conference: 'Great Midwest Athletic Conference', mascot: 'Dragons', primaryColor: '#2D6444', secondaryColor: '#FFB81C' },
            { name: 'Walsh', conference: 'Great Midwest Athletic Conference', mascot: 'Cavaliers', primaryColor: '#8C2131', secondaryColor: '#FFB81C' },

            // Gulf South Conference (GSC)
            { name: 'Delta State', conference: 'Gulf South Conference', mascot: 'Statesmen', primaryColor: '#006341', secondaryColor: '#FFFFFF' },
            { name: 'Mississippi College', conference: 'Gulf South Conference', mascot: 'Choctaws', primaryColor: '#002D72', secondaryColor: '#B3A369' },
            { name: 'Shorter', conference: 'Gulf South Conference', mascot: 'Hawks', primaryColor: '#0033A0', secondaryColor: '#FFFFFF' },
            { name: 'West Alabama', conference: 'Gulf South Conference', mascot: 'Tigers', primaryColor: '#CC0000', secondaryColor: '#808080' },
            { name: 'West Florida', conference: 'Gulf South Conference', mascot: 'Argonauts', primaryColor: '#0055A2', secondaryColor: '#7EA9C8' },
            { name: 'Valdosta State', conference: 'Gulf South Conference', mascot: 'Blazers', primaryColor: '#CC0000', secondaryColor: '#000000' },

            // Lone Star Conference (LSC)
            { name: 'Angelo State', conference: 'Lone Star Conference', mascot: 'Rams', primaryColor: '#005DAA', secondaryColor: '#FFB81C' },
            { name: 'Azusa Pacific', conference: 'Lone Star Conference', mascot: 'Cougars', primaryColor: '#000000', secondaryColor: '#C69214' },
            { name: 'Eastern New Mexico', conference: 'Lone Star Conference', mascot: 'Greyhounds', primaryColor: '#006747', secondaryColor: '#A8996E' },
            { name: 'Midwestern State', conference: 'Lone Star Conference', mascot: 'Mustangs', primaryColor: '#8B2346', secondaryColor: '#FFB81C' },
            { name: 'Sul Ross State', conference: 'Lone Star Conference', mascot: 'Lobos', primaryColor: '#862633', secondaryColor: '#000000' },
            { name: 'Texas A&M–Kingsville', conference: 'Lone Star Conference', mascot: 'Javelinas', primaryColor: '#0C2340', secondaryColor: '#FFB81C' },
            { name: 'UT Permian Basin', conference: 'Lone Star Conference', mascot: 'Falcons', primaryColor: '#F15A22', secondaryColor: '#000000' },
            { name: 'West Texas A&M', conference: 'Lone Star Conference', mascot: 'Buffaloes', primaryColor: '#400B42', secondaryColor: '#FFFFFF' },

            // Mid-America Intercollegiate Athletics Association (MIAA)
            { name: 'Central Missouri', conference: 'Mid-America Intercollegiate Athletics Association', mascot: 'Mules', primaryColor: '#CF202E', secondaryColor: '#000000' },
            { name: 'Emporia State', conference: 'Mid-America Intercollegiate Athletics Association', mascot: 'Hornets', primaryColor: '#000000', secondaryColor: '#FFC72C' },
            { name: 'Fort Hays State', conference: 'Mid-America Intercollegiate Athletics Association', mascot: 'Tigers', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Missouri Southern', conference: 'Mid-America Intercollegiate Athletics Association', mascot: 'Lions', primaryColor: '#007A33', secondaryColor: '#000000' },
            { name: 'Missouri Western', conference: 'Mid-America Intercollegiate Athletics Association', mascot: 'Griffons', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Northwest Missouri State', conference: 'Mid-America Intercollegiate Athletics Association', mascot: 'Bearcats', primaryColor: '#006747', secondaryColor: '#000000' },
            { name: 'Pittsburg State', conference: 'Mid-America Intercollegiate Athletics Association', mascot: 'Gorillas', primaryColor: '#CC0001', secondaryColor: '#FFB81C' },
            { name: 'Washburn', conference: 'Mid-America Intercollegiate Athletics Association', mascot: 'Ichabods', primaryColor: '#003F87', secondaryColor: '#FFFFFF' },

            // Mountain East Conference (MEC)
            { name: 'Alderson Broaddus', conference: 'Mountain East Conference', mascot: 'Battlers', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Concord', conference: 'Mountain East Conference', mascot: 'Mountain Lions', primaryColor: '#8A2432', secondaryColor: '#999999' },
            { name: 'Fairmont State', conference: 'Mountain East Conference', mascot: 'Fighting Falcons', primaryColor: '#AF1E2D', secondaryColor: '#000000' },
            { name: 'Frostburg State', conference: 'Mountain East Conference', mascot: 'Bobcats', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Glenville State', conference: 'Mountain East Conference', mascot: 'Pioneers', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Notre Dame College', conference: 'Mountain East Conference', mascot: 'Falcons', primaryColor: '#003594', secondaryColor: '#FFFFFF' },
            { name: 'Charleston', conference: 'Mountain East Conference', mascot: 'Golden Eagles', primaryColor: '#8B2131', secondaryColor: '#85714D' },
            { name: 'Virginia-Wise', conference: 'Mountain East Conference', mascot: 'Highland Cavaliers', primaryColor: '#FF0000', secondaryColor: '#808080' },
            { name: 'West Liberty', conference: 'Mountain East Conference', mascot: 'Hilltoppers', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'West Virginia State', conference: 'Mountain East Conference', mascot: 'Yellow Jackets', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'West Virginia Wesleyan', conference: 'Mountain East Conference', mascot: 'Bobcats', primaryColor: '#FF7900', secondaryColor: '#000000' },
            { name: 'Wheeling', conference: 'Mountain East Conference', mascot: 'Cardinals', primaryColor: '#CC0000', secondaryColor: '#000000' },

            // Northeast-10 Conference (NE10)
            { name: 'American International', conference: 'Northeast-10 Conference', mascot: 'Yellow Jackets', primaryColor: '#FDB913', secondaryColor: '#000000' },
            { name: 'Assumption', conference: 'Northeast-10 Conference', mascot: 'Greyhounds', primaryColor: '#0033A0', secondaryColor: '#FFFFFF' },
            { name: 'Bentley', conference: 'Northeast-10 Conference', mascot: 'Falcons', primaryColor: '#003478', secondaryColor: '#FFB81C' },
            { name: 'Franklin Pierce', conference: 'Northeast-10 Conference', mascot: 'Ravens', primaryColor: '#8A2432', secondaryColor: '#FFB81C' },
            { name: 'Pace', conference: 'Northeast-10 Conference', mascot: 'Setters', primaryColor: '#00337F', secondaryColor: '#CFC7B9' },
            { name: 'Post', conference: 'Northeast-10 Conference', mascot: 'Eagles', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Saint Anselm', conference: 'Northeast-10 Conference', mascot: 'Hawks', primaryColor: '#002B5C', secondaryColor: '#FFFFFF' },
            { name: 'Southern Connecticut State', conference: 'Northeast-10 Conference', mascot: 'Owls', primaryColor: '#002D72', secondaryColor: '#FFFFFF' },
            { name: 'New Haven', conference: 'Northeast-10 Conference', mascot: 'Chargers', primaryColor: '#004990', secondaryColor: '#FFB81C' },

            // Northern Sun Intercollegiate Conference (NSIC)
            { name: 'Augustana', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Vikings', primaryColor: '#002D72', secondaryColor: '#FFB81C' },
            { name: 'Bemidji State', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Beavers', primaryColor: '#004236', secondaryColor: '#000000' },
            { name: 'Concordia-St. Paul', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Golden Bears', primaryColor: '#002D72', secondaryColor: '#FFB81C' },
            { name: 'Minnesota State Moorhead', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Dragons', primaryColor: '#C8102E', secondaryColor: '#000000' },
            { name: 'Minnesota State-Mankato', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Mavericks', primaryColor: '#4C0076', secondaryColor: '#FDB913' },
            { name: 'Northern State', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Wolves', primaryColor: '#862633', secondaryColor: '#FFB81C' },
            { name: 'Southwest Minnesota State', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Mustangs', primaryColor: '#582C83', secondaryColor: '#8A8D8F' },
            { name: 'Mary', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Marauders', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Minnesota Crookston', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Golden Eagles', primaryColor: '#7C2529', secondaryColor: '#FFB81C' },
            { name: 'Minnesota Duluth', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Bulldogs', primaryColor: '#7A0019', secondaryColor: '#FFB81C' },
            { name: 'Sioux Falls', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Cougars', primaryColor: '#582C83', secondaryColor: '#FFFFFF' },
            { name: 'Wayne State (NE)', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Wildcats', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Winona State', conference: 'Northern Sun Intercollegiate Conference', mascot: 'Warriors', primaryColor: '#462B7D', secondaryColor: '#000000' },

            // Pennsylvania State Athletic Conference (PSAC)
            { name: 'Bloomsburg', conference: 'Pennsylvania State Athletic Conference', mascot: 'Huskies', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'California (PA)', conference: 'Pennsylvania State Athletic Conference', mascot: 'Vulcans', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Clarion', conference: 'Pennsylvania State Athletic Conference', mascot: 'Golden Eagles', primaryColor: '#004990', secondaryColor: '#FFB81C' },
            { name: 'East Stroudsburg', conference: 'Pennsylvania State Athletic Conference', mascot: 'Warriors', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Edinboro', conference: 'Pennsylvania State Athletic Conference', mascot: 'Fighting Scots', primaryColor: '#AF1E2D', secondaryColor: '#000000' },
            { name: 'Gannon', conference: 'Pennsylvania State Athletic Conference', mascot: 'Golden Knights', primaryColor: '#862633', secondaryColor: '#FFB81C' },
            { name: 'Indiana (PA)', conference: 'Pennsylvania State Athletic Conference', mascot: 'Crimson Hawks', primaryColor: '#9B1B1F', secondaryColor: '#808080' },
            { name: 'Kutztown', conference: 'Pennsylvania State Athletic Conference', mascot: 'Golden Bears', primaryColor: '#731934', secondaryColor: '#FFB81C' },
            { name: 'Lock Haven', conference: 'Pennsylvania State Athletic Conference', mascot: 'Bald Eagles', primaryColor: '#AC1A2F', secondaryColor: '#FFFFFF' },
            { name: 'Mansfield', conference: 'Pennsylvania State Athletic Conference', mascot: 'Mountaineers', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Mercyhurst', conference: 'Pennsylvania State Athletic Conference', mascot: 'Lakers', primaryColor: '#00387B', secondaryColor: '#6CC24A' },
            { name: 'Millersville', conference: 'Pennsylvania State Athletic Conference', mascot: 'Marauders', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Seton Hill', conference: 'Pennsylvania State Athletic Conference', mascot: 'Griffins', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'Shepherd', conference: 'Pennsylvania State Athletic Conference', mascot: 'Rams', primaryColor: '#005EB8', secondaryColor: '#FFB81C' },
            { name: 'Shippensburg', conference: 'Pennsylvania State Athletic Conference', mascot: 'Raiders', primaryColor: '#004990', secondaryColor: '#CC0000' },
            { name: 'Slippery Rock', conference: 'Pennsylvania State Athletic Conference', mascot: 'The Rock', primaryColor: '#004990', secondaryColor: '#FFB81C' },
            { name: 'West Chester', conference: 'Pennsylvania State Athletic Conference', mascot: 'Golden Rams', primaryColor: '#461B7E', secondaryColor: '#FFB81C' },

            // Rocky Mountain Athletic Conference (RMAC)
            { name: 'Adams State', conference: 'Rocky Mountain Athletic Conference', mascot: 'Grizzlies', primaryColor: '#013C65', secondaryColor: '#FFB81C' },
            { name: 'Black Hills State', conference: 'Rocky Mountain Athletic Conference', mascot: 'Yellow Jackets', primaryColor: '#007A33', secondaryColor: '#FFB81C' },
            { name: 'Chadron State', conference: 'Rocky Mountain Athletic Conference', mascot: 'Eagles', primaryColor: '#000080', secondaryColor: '#FFB81C' },
            { name: 'Colorado Mesa', conference: 'Rocky Mountain Athletic Conference', mascot: 'Mavericks', primaryColor: '#8B0000', secondaryColor: '#000000' },
            { name: 'Colorado School of Mines', conference: 'Rocky Mountain Athletic Conference', mascot: 'Orediggers', primaryColor: '#002D72', secondaryColor: '#8A8D8F' },
            { name: 'CSU Pueblo', conference: 'Rocky Mountain Athletic Conference', mascot: 'ThunderWolves', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Fort Lewis', conference: 'Rocky Mountain Athletic Conference', mascot: 'Skyhawks', primaryColor: '#0033A0', secondaryColor: '#FFB81C' },
            { name: 'New Mexico Highlands', conference: 'Rocky Mountain Athletic Conference', mascot: 'Cowboys', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'South Dakota Mines', conference: 'Rocky Mountain Athletic Conference', mascot: 'Hardrockers', primaryColor: '#004990', secondaryColor: '#FFB81C' },
            { name: 'Western Colorado', conference: 'Rocky Mountain Athletic Conference', mascot: 'Mountaineers', primaryColor: '#CC0000', secondaryColor: '#000000' },

            // South Atlantic Conference (SAC)
            { name: 'Anderson', conference: 'South Atlantic Conference', mascot: 'Trojans', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Barton', conference: 'South Atlantic Conference', mascot: 'Bulldogs', primaryColor: '#0066CC', secondaryColor: '#FFFFFF' },
            { name: 'Carson-Newman', conference: 'South Atlantic Conference', mascot: 'Eagles', primaryColor: '#FF7F00', secondaryColor: '#0033A0' },
            { name: 'Catawba', conference: 'South Atlantic Conference', mascot: 'Indians', primaryColor: '#00249C', secondaryColor: '#FFFFFF' },
            { name: 'Emory & Henry', conference: 'South Atlantic Conference', mascot: 'Wasps', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Lenoir-Rhyne', conference: 'South Atlantic Conference', mascot: 'Bears', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'Limestone', conference: 'South Atlantic Conference', mascot: 'Saints', primaryColor: '#004990', secondaryColor: '#FFB81C' },
            { name: 'Mars Hill', conference: 'South Atlantic Conference', mascot: 'Lions', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Newberry', conference: 'South Atlantic Conference', mascot: 'Wolves', primaryColor: '#8B0000', secondaryColor: '#808080' },
            { name: 'Tusculum', conference: 'South Atlantic Conference', mascot: 'Pioneers', primaryColor: '#FF7F00', secondaryColor: '#000000' },
            { name: 'Wingate', conference: 'South Atlantic Conference', mascot: 'Bulldogs', primaryColor: '#003087', secondaryColor: '#FFB81C' },

            // Southern Intercollegiate Athletic Conference (SIAC)
            { name: 'Albany State', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Golden Rams', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Allen', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Yellow Jackets', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Benedict', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Tigers', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Central State', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Marauders', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'Clark Atlanta', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Panthers', primaryColor: '#CC0000', secondaryColor: '#808080' },
            { name: 'Edward Waters', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Tigers', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Fort Valley State', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Wildcats', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Kentucky State', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Thorobreds', primaryColor: '#006747', secondaryColor: '#FFB81C' },
            { name: 'Lane', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Dragons', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Miles', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Golden Bears', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Morehouse', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Maroon Tigers', primaryColor: '#8B0000', secondaryColor: '#FFFFFF' },
            { name: 'Savannah State', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Tigers', primaryColor: '#FF7F00', secondaryColor: '#003087' },
            { name: 'Tuskegee', conference: 'Southern Intercollegiate Athletic Conference', mascot: 'Golden Tigers', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },

            // American Rivers Conference (ARC)
            { name: 'Buena Vista', conference: 'American Rivers Conference', mascot: 'Beavers', primaryColor: '#004990', secondaryColor: '#FFB81C' },
            { name: 'Central', conference: 'American Rivers Conference', mascot: 'Dutch', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
            { name: 'Coe', conference: 'American Rivers Conference', mascot: 'Kohawks', primaryColor: '#FF0000', secondaryColor: '#000000' },
            { name: 'Dubuque', conference: 'American Rivers Conference', mascot: 'Spartans', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Loras', conference: 'American Rivers Conference', mascot: 'Duhawks', primaryColor: '#492F91', secondaryColor: '#FFB81C' },
            { name: 'Luther', conference: 'American Rivers Conference', mascot: 'Norse', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Nebraska Wesleyan', conference: 'American Rivers Conference', mascot: 'Prairie Wolves', primaryColor: '#F4AA00', secondaryColor: '#000000' },
            { name: 'Simpson', conference: 'American Rivers Conference', mascot: 'Storm', primaryColor: '#C8102E', secondaryColor: '#FFB81C' },
            { name: 'Wartburg', conference: 'American Rivers Conference', mascot: 'Knights', primaryColor: '#F47920', secondaryColor: '#000000' },

            // American Southwest Conference (ASC)
            { name: 'East Texas Baptist', conference: 'American Southwest Conference', mascot: 'Tigers', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Hardin-Simmons', conference: 'American Southwest Conference', mascot: 'Cowboys', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Howard Payne', conference: 'American Southwest Conference', mascot: 'Yellow Jackets', primaryColor: '#FDB913', secondaryColor: '#000000' },
            { name: 'Mary Hardin-Baylor', conference: 'American Southwest Conference', mascot: 'Crusaders', primaryColor: '#004B8D', secondaryColor: '#FFC72C' },
            { name: 'McMurry', conference: 'American Southwest Conference', mascot: 'War Hawks', primaryColor: '#8B0000', secondaryColor: '#FFFFFF' },
            { name: 'Sul Ross State', conference: 'American Southwest Conference', mascot: 'Lobos', primaryColor: '#862633', secondaryColor: '#000000' },
            { name: 'Texas Lutheran', conference: 'American Southwest Conference', mascot: 'Bulldogs', primaryColor: '#000000', secondaryColor: '#FFB81C' },

            // Centennial Conference
            { name: 'Dickinson', conference: 'Centennial Conference', mascot: 'Red Devils', primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
            { name: 'Franklin & Marshall', conference: 'Centennial Conference', mascot: 'Diplomats', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Gettysburg', conference: 'Centennial Conference', mascot: 'Bullets', primaryColor: '#F47920', secondaryColor: '#000000' },
            { name: 'Johns Hopkins', conference: 'Centennial Conference', mascot: 'Blue Jays', primaryColor: '#002D72', secondaryColor: '#FFFFFF' },
            { name: 'Juniata', conference: 'Centennial Conference', mascot: 'Eagles', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'McDaniel', conference: 'Centennial Conference', mascot: 'Green Terror', primaryColor: '#006341', secondaryColor: '#FFB81C' },
            { name: 'Muhlenberg', conference: 'Centennial Conference', mascot: 'Mules', primaryColor: '#C8102E', secondaryColor: '#808080' },
            { name: 'Susquehanna', conference: 'Centennial Conference', mascot: 'River Hawks', primaryColor: '#8B0000', secondaryColor: '#FF8200' },
            { name: 'Ursinus', conference: 'Centennial Conference', mascot: 'Bears', primaryColor: '#C8102E', secondaryColor: '#000000' },

            // College Conference of Illinois and Wisconsin (CCIW)
            { name: 'Augustana', conference: 'College Conference of Illinois and Wisconsin', mascot: 'Vikings', primaryColor: '#0057B8', secondaryColor: '#FFC72C' },
            { name: 'Carroll', conference: 'College Conference of Illinois and Wisconsin', mascot: 'Pioneers', primaryColor: '#F47920', secondaryColor: '#000000' },
            { name: 'Carthage', conference: 'College Conference of Illinois and Wisconsin', mascot: 'Firebirds', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Elmhurst', conference: 'College Conference of Illinois and Wisconsin', mascot: 'Bluejays', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Illinois Wesleyan', conference: 'College Conference of Illinois and Wisconsin', mascot: 'Titans', primaryColor: '#1E4D2B', secondaryColor: '#FFFFFF' },
            { name: 'Millikin', conference: 'College Conference of Illinois and Wisconsin', mascot: 'Big Blue', primaryColor: '#002D72', secondaryColor: '#FFFFFF' },
            { name: 'North Central', conference: 'College Conference of Illinois and Wisconsin', mascot: 'Cardinals', primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
            { name: 'North Park', conference: 'College Conference of Illinois and Wisconsin', mascot: 'Vikings', primaryColor: '#0033A0', secondaryColor: '#FFB81C' },
            { name: 'Wheaton', conference: 'College Conference of Illinois and Wisconsin', mascot: 'Thunder', primaryColor: '#000080', secondaryColor: '#FFB81C' },

            // Eastern Collegiate Football Conference (ECFC)
            { name: 'Alfred State', conference: 'Eastern Collegiate Football Conference', mascot: 'Pioneers', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Anna Maria', conference: 'Eastern Collegiate Football Conference', mascot: 'AMCATS', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Castleton', conference: 'Eastern Collegiate Football Conference', mascot: 'Spartans', primaryColor: '#00563F', secondaryColor: '#FFFFFF' },
            { name: 'Dean', conference: 'Eastern Collegiate Football Conference', mascot: 'Bulldogs', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Gallaudet', conference: 'Eastern Collegiate Football Conference', mascot: 'Bison', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Keystone', conference: 'Eastern Collegiate Football Conference', mascot: 'Giants', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'SUNY Maritime', conference: 'Eastern Collegiate Football Conference', mascot: 'Privateers', primaryColor: '#003087', secondaryColor: '#FFB81C' },

            // Empire 8
            { name: 'Alfred', conference: 'Empire 8', mascot: 'Saxons', primaryColor: '#461D7C', secondaryColor: '#FFB81C' },
            { name: 'Brockport', conference: 'Empire 8', mascot: 'Golden Eagles', primaryColor: '#FFB81C', secondaryColor: '#00563F' },
            { name: 'Cortland', conference: 'Empire 8', mascot: 'Red Dragons', primaryColor: '#CE1126', secondaryColor: '#FFFFFF' },
            { name: 'Hartwick', conference: 'Empire 8', mascot: 'Hawks', primaryColor: '#004990', secondaryColor: '#FFFFFF' },
            { name: 'Hilbert', conference: 'Empire 8', mascot: 'Hawks', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Morrisville State', conference: 'Empire 8', mascot: 'Mustangs', primaryColor: '#006341', secondaryColor: '#FFFFFF' },
            { name: 'St. John Fisher', conference: 'Empire 8', mascot: 'Cardinals', primaryColor: '#CC0000', secondaryColor: '#FFB81C' },
            { name: 'Utica', conference: 'Empire 8', mascot: 'Pioneers', primaryColor: '#003087', secondaryColor: '#F47920' },

            // Heartland Collegiate Athletic Conference (HCAC)
            { name: 'Anderson', conference: 'Heartland Collegiate Athletic Conference', mascot: 'Ravens', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Bluffton', conference: 'Heartland Collegiate Athletic Conference', mascot: 'Beavers', primaryColor: '#582C83', secondaryColor: '#FFFFFF' },
            { name: 'Defiance', conference: 'Heartland Collegiate Athletic Conference', mascot: 'Yellow Jackets', primaryColor: '#FFB81C', secondaryColor: '#461D7C' },
            { name: 'Franklin', conference: 'Heartland Collegiate Athletic Conference', mascot: 'Grizzlies', primaryColor: '#00205B', secondaryColor: '#FFB81C' },
            { name: 'Hanover', conference: 'Heartland Collegiate Athletic Conference', mascot: 'Panthers', primaryColor: '#CC0000', secondaryColor: '#0033A0' },
            { name: 'Manchester', conference: 'Heartland Collegiate Athletic Conference', mascot: 'Spartans', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Mount St. Joseph', conference: 'Heartland Collegiate Athletic Conference', mascot: 'Lions', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Rose-Hulman', conference: 'Heartland Collegiate Athletic Conference', mascot: 'Fightin\' Engineers', primaryColor: '#9D2235', secondaryColor: '#FFFFFF' },

            // Liberty League
            { name: 'Hobart and William Smith', conference: 'Liberty League', mascot: 'Statesmen', primaryColor: '#461D7C', secondaryColor: '#F76900' },
            { name: 'Ithaca', conference: 'Liberty League', mascot: 'Bombers', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'RPI', conference: 'Liberty League', mascot: 'Engineers', primaryColor: '#E2231A', secondaryColor: '#000000' },
            { name: 'Rochester', conference: 'Liberty League', mascot: 'Yellowjackets', primaryColor: '#FFD100', secondaryColor: '#003B71' },
            { name: 'St. Lawrence', conference: 'Liberty League', mascot: 'Saints', primaryColor: '#AF1E2D', secondaryColor: '#8C2633' },
            { name: 'Union', conference: 'Liberty League', mascot: 'Dutchmen', primaryColor: '#862633', secondaryColor: '#000000' },

            // Massachusetts State Collegiate Athletic Conference (MASCAC)
            { name: 'Bridgewater State', conference: 'Massachusetts State Collegiate Athletic Conference', mascot: 'Bears', primaryColor: '#CE1126', secondaryColor: '#000000' },
            { name: 'Fitchburg State', conference: 'Massachusetts State Collegiate Athletic Conference', mascot: 'Falcons', primaryColor: '#004990', secondaryColor: '#FFB81C' },
            { name: 'Framingham State', conference: 'Massachusetts State Collegiate Athletic Conference', mascot: 'Rams', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Massachusetts Maritime', conference: 'Massachusetts State Collegiate Athletic Conference', mascot: 'Buccaneers', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Plymouth State', conference: 'Massachusetts State Collegiate Athletic Conference', mascot: 'Panthers', primaryColor: '#004990', secondaryColor: '#1C8B3B' },
            { name: 'Westfield State', conference: 'Massachusetts State Collegiate Athletic Conference', mascot: 'Owls', primaryColor: '#0033A0', secondaryColor: '#FFFFFF' },
            { name: 'Western Connecticut State', conference: 'Massachusetts State Collegiate Athletic Conference', mascot: 'Colonials', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Worcester State', conference: 'Massachusetts State Collegiate Athletic Conference', mascot: 'Lancers', primaryColor: '#003087', secondaryColor: '#FFB81C' },

            // Michigan Intercollegiate Athletic Association (MIAA)
            { name: 'Adrian', conference: 'Michigan Intercollegiate Athletic Association', mascot: 'Bulldogs', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Albion', conference: 'Michigan Intercollegiate Athletic Association', mascot: 'Britons', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Alma', conference: 'Michigan Intercollegiate Athletic Association', mascot: 'Scots', primaryColor: '#FFCD00', secondaryColor: '#00274C' },
            { name: 'Calvin', conference: 'Michigan Intercollegiate Athletic Association', mascot: 'Knights', primaryColor: '#97252B', secondaryColor: '#FFB81C' },
            { name: 'Hope', conference: 'Michigan Intercollegiate Athletic Association', mascot: 'Flying Dutchmen', primaryColor: '#002244', secondaryColor: '#F47920' },
            { name: 'Kalamazoo', conference: 'Michigan Intercollegiate Athletic Association', mascot: 'Hornets', primaryColor: '#F47920', secondaryColor: '#000000' },
            { name: 'Olivet', conference: 'Michigan Intercollegiate Athletic Association', mascot: 'Comets', primaryColor: '#CE1126', secondaryColor: '#000000' },

            // Middle Atlantic Conference (MAC)
            { name: 'Albright', conference: 'Middle Atlantic Conference', mascot: 'Lions', primaryColor: '#CE1126', secondaryColor: '#000000' },
            { name: 'Alvernia', conference: 'Middle Atlantic Conference', mascot: 'Golden Wolves', primaryColor: '#79282C', secondaryColor: '#FFB81C' },
            { name: 'Delaware Valley', conference: 'Middle Atlantic Conference', mascot: 'Aggies', primaryColor: '#004990', secondaryColor: '#FFB81C' },
            { name: 'Eastern', conference: 'Middle Atlantic Conference', mascot: 'Eagles', primaryColor: '#872434', secondaryColor: '#000000' },
            { name: 'FDU-Florham', conference: 'Middle Atlantic Conference', mascot: 'Devils', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'King\'s', conference: 'Middle Atlantic Conference', mascot: 'Monarchs', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Lebanon Valley', conference: 'Middle Atlantic Conference', mascot: 'Flying Dutchmen', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Lycoming', conference: 'Middle Atlantic Conference', mascot: 'Warriors', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Misericordia', conference: 'Middle Atlantic Conference', mascot: 'Cougars', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Stevenson', conference: 'Middle Atlantic Conference', mascot: 'Mustangs', primaryColor: '#004990', secondaryColor: '#1C8B3B' },
            { name: 'Widener', conference: 'Middle Atlantic Conference', mascot: 'Pride', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Wilkes', conference: 'Middle Atlantic Conference', mascot: 'Colonels', primaryColor: '#003087', secondaryColor: '#FFB81C' },

            // Midwest Conference (MWC)
            { name: 'Beloit', conference: 'Midwest Conference', mascot: 'Buccaneers', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Chicago', conference: 'Midwest Conference', mascot: 'Maroons', primaryColor: '#800000', secondaryColor: '#FFFFFF' },
            { name: 'Cornell College', conference: 'Midwest Conference', mascot: 'Rams', primaryColor: '#461D7C', secondaryColor: '#FFFFFF' },
            { name: 'Grinnell', conference: 'Midwest Conference', mascot: 'Pioneers', primaryColor: '#C8102E', secondaryColor: '#000000' },
            { name: 'Illinois College', conference: 'Midwest Conference', mascot: 'Blueboys', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Knox', conference: 'Midwest Conference', mascot: 'Prairie Fire', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Lake Forest', conference: 'Midwest Conference', mascot: 'Foresters', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Lawrence', conference: 'Midwest Conference', mascot: 'Vikings', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Monmouth', conference: 'Midwest Conference', mascot: 'Fighting Scots', primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
            { name: 'Ripon', conference: 'Midwest Conference', mascot: 'Red Hawks', primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },

            // Minnesota Intercollegiate Athletic Conference (MIAC)
            { name: 'Augsburg', conference: 'Minnesota Intercollegiate Athletic Conference', mascot: 'Auggies', primaryColor: '#582C83', secondaryColor: '#FFFFFF' },
            { name: 'Bethel', conference: 'Minnesota Intercollegiate Athletic Conference', mascot: 'Royals', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Carleton', conference: 'Minnesota Intercollegiate Athletic Conference', mascot: 'Knights', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Concordia-Moorhead', conference: 'Minnesota Intercollegiate Athletic Conference', mascot: 'Cobbers', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'Gustavus Adolphus', conference: 'Minnesota Intercollegiate Athletic Conference', mascot: 'Gusties', primaryColor: '#FFB81C', secondaryColor: '#000000' },
            { name: 'Hamline', conference: 'Minnesota Intercollegiate Athletic Conference', mascot: 'Pipers', primaryColor: '#CC0000', secondaryColor: '#808080' },
            { name: 'Macalester', conference: 'Minnesota Intercollegiate Athletic Conference', mascot: 'Scots', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Saint John\'s', conference: 'Minnesota Intercollegiate Athletic Conference', mascot: 'Johnnies', primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
            { name: 'St. Olaf', conference: 'Minnesota Intercollegiate Athletic Conference', mascot: 'Oles', primaryColor: '#000000', secondaryColor: '#FFB81C' },

            // New England Small College Athletic Conference (NESCAC)
            { name: 'Amherst', conference: 'New England Small College Athletic Conference', mascot: 'Mammoths', primaryColor: '#461D7C', secondaryColor: '#FFFFFF' },
            { name: 'Bates', conference: 'New England Small College Athletic Conference', mascot: 'Bobcats', primaryColor: '#8B0000', secondaryColor: '#000000' },
            { name: 'Bowdoin', conference: 'New England Small College Athletic Conference', mascot: 'Polar Bears', primaryColor: '#000000', secondaryColor: '#FFFFFF' },
            { name: 'Colby', conference: 'New England Small College Athletic Conference', mascot: 'Mules', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Hamilton', conference: 'New England Small College Athletic Conference', mascot: 'Continentals', primaryColor: '#002F87', secondaryColor: '#FFB81C' },
            { name: 'Middlebury', conference: 'New England Small College Athletic Conference', mascot: 'Panthers', primaryColor: '#003087', secondaryColor: '#FFFFFF' },
            { name: 'Trinity', conference: 'New England Small College Athletic Conference', mascot: 'Bantams', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Tufts', conference: 'New England Small College Athletic Conference', mascot: 'Jumbos', primaryColor: '#3E8EDE', secondaryColor: '#4E2A84' },
            { name: 'Wesleyan', conference: 'New England Small College Athletic Conference', mascot: 'Cardinals', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Williams', conference: 'New England Small College Athletic Conference', mascot: 'Ephs', primaryColor: '#582C83', secondaryColor: '#FFB81C' },

            // New England Women's and Men's Athletic Conference (NEWMAC)
            { name: 'Catholic', conference: 'New England Women\'s and Men\'s Athletic Conference', mascot: 'Cardinals', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Coast Guard', conference: 'New England Women\'s and Men\'s Athletic Conference', mascot: 'Bears', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Merchant Marine', conference: 'New England Women\'s and Men\'s Athletic Conference', mascot: 'Mariners', primaryColor: '#003087', secondaryColor: '#808080' },
            { name: 'MIT', conference: 'New England Women\'s and Men\'s Athletic Conference', mascot: 'Engineers', primaryColor: '#8A8B8C', secondaryColor: '#A31F34' },
            { name: 'Norwich', conference: 'New England Women\'s and Men\'s Athletic Conference', mascot: 'Cadets', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'Springfield', conference: 'New England Women\'s and Men\'s Athletic Conference', mascot: 'Pride', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'WPI', conference: 'New England Women\'s and Men\'s Athletic Conference', mascot: 'Engineers', primaryColor: '#AC2B37', secondaryColor: '#A9B0B7' },

            // New Jersey Athletic Conference (NJAC)
            { name: 'Christopher Newport', conference: 'New Jersey Athletic Conference', mascot: 'Captains', primaryColor: '#003087', secondaryColor: '#808080' },
            { name: 'Kean', conference: 'New Jersey Athletic Conference', mascot: 'Cougars', primaryColor: '#002D72', secondaryColor: '#7C878E' },
            { name: 'Montclair State', conference: 'New Jersey Athletic Conference', mascot: 'Red Hawks', primaryColor: '#CE1126', secondaryColor: '#000000' },
            { name: 'Rowan', conference: 'New Jersey Athletic Conference', mascot: 'Profs', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Salisbury', conference: 'New Jersey Athletic Conference', mascot: 'Sea Gulls', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'TCNJ', conference: 'New Jersey Athletic Conference', mascot: 'Lions', primaryColor: '#293F6F', secondaryColor: '#FFC425' },
            { name: 'William Paterson', conference: 'New Jersey Athletic Conference', mascot: 'Pioneers', primaryColor: '#FF6B1C', secondaryColor: '#000000' },

            // North Coast Athletic Conference (NCAC)
            { name: 'Allegheny', conference: 'North Coast Athletic Conference', mascot: 'Gators', primaryColor: '#00205B', secondaryColor: '#FFB81C' },
            { name: 'Denison', conference: 'North Coast Athletic Conference', mascot: 'Big Red', primaryColor: '#C41E3A', secondaryColor: '#000000' },
            { name: 'DePauw', conference: 'North Coast Athletic Conference', mascot: 'Tigers', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Hiram', conference: 'North Coast Athletic Conference', mascot: 'Terriers', primaryColor: '#0033A0', secondaryColor: '#CC0000' },
            { name: 'Kenyon', conference: 'North Coast Athletic Conference', mascot: 'Lords', primaryColor: '#4B2E83', secondaryColor: '#FFFFFF' },
            { name: 'Oberlin', conference: 'North Coast Athletic Conference', mascot: 'Yeomen', primaryColor: '#CC0000', secondaryColor: '#FFB81C' },
            { name: 'Ohio Wesleyan', conference: 'North Coast Athletic Conference', mascot: 'Battling Bishops', primaryColor: '#C8102E', secondaryColor: '#000000' },
            { name: 'Wabash', conference: 'North Coast Athletic Conference', mascot: 'Little Giants', primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
            { name: 'Wittenberg', conference: 'North Coast Athletic Conference', mascot: 'Tigers', primaryColor: '#CE1126', secondaryColor: '#000000' },
            { name: 'Wooster', conference: 'North Coast Athletic Conference', mascot: 'Fighting Scots', primaryColor: '#C8102E', secondaryColor: '#000000' },

            // Northern Athletics Collegiate Conference (NACC)
            { name: 'Aurora', conference: 'Northern Athletics Collegiate Conference', mascot: 'Spartans', primaryColor: '#002D72', secondaryColor: '#FFB81C' },
            { name: 'Benedictine', conference: 'Northern Athletics Collegiate Conference', mascot: 'Eagles', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Concordia Chicago', conference: 'Northern Athletics Collegiate Conference', mascot: 'Cougars', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'Concordia Wisconsin', conference: 'Northern Athletics Collegiate Conference', mascot: 'Falcons', primaryColor: '#002D72', secondaryColor: '#FFB81C' },
            { name: 'Lakeland', conference: 'Northern Athletics Collegiate Conference', mascot: 'Muskies', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Rockford', conference: 'Northern Athletics Collegiate Conference', mascot: 'Regents', primaryColor: '#582C83', secondaryColor: '#FFB81C' },
            { name: 'Wisconsin Lutheran', conference: 'Northern Athletics Collegiate Conference', mascot: 'Warriors', primaryColor: '#006747', secondaryColor: '#FFFFFF' },

            // Northwest Conference (NWC)
            { name: 'George Fox', conference: 'Northwest Conference', mascot: 'Bruins', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Lewis & Clark', conference: 'Northwest Conference', mascot: 'Pioneers', primaryColor: '#FF6B1C', secondaryColor: '#000000' },
            { name: 'Linfield', conference: 'Northwest Conference', mascot: 'Wildcats', primaryColor: '#582C83', secondaryColor: '#CC0000' },
            { name: 'Pacific Lutheran', conference: 'Northwest Conference', mascot: 'Lutes', primaryColor: '#862633', secondaryColor: '#FFB81C' },
            { name: 'Pacific', conference: 'Northwest Conference', mascot: 'Boxers', primaryColor: '#C8102E', secondaryColor: '#000000' },
            { name: 'Puget Sound', conference: 'Northwest Conference', mascot: 'Loggers', primaryColor: '#660000', secondaryColor: '#FFB81C' },
            { name: 'Whitworth', conference: 'Northwest Conference', mascot: 'Pirates', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Willamette', conference: 'Northwest Conference', mascot: 'Bearcats', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },

            // Ohio Athletic Conference (OAC)
            { name: 'Baldwin Wallace', conference: 'Ohio Athletic Conference', mascot: 'Yellow Jackets', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Capital', conference: 'Ohio Athletic Conference', mascot: 'Comets', primaryColor: '#461D7C', secondaryColor: '#FFFFFF' },
            { name: 'Heidelberg', conference: 'Ohio Athletic Conference', mascot: 'Student Princes', primaryColor: '#F47920', secondaryColor: '#000000' },
            { name: 'John Carroll', conference: 'Ohio Athletic Conference', mascot: 'Blue Streaks', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Marietta', conference: 'Ohio Athletic Conference', mascot: 'Pioneers', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Mount Union', conference: 'Ohio Athletic Conference', mascot: 'Purple Raiders', primaryColor: '#582C83', secondaryColor: '#FFFFFF' },
            { name: 'Muskingum', conference: 'Ohio Athletic Conference', mascot: 'Fighting Muskies', primaryColor: '#000000', secondaryColor: '#8B0000' },
            { name: 'Ohio Northern', conference: 'Ohio Athletic Conference', mascot: 'Polar Bears', primaryColor: '#FF8200', secondaryColor: '#000000' },
            { name: 'Otterbein', conference: 'Ohio Athletic Conference', mascot: 'Cardinals', primaryColor: '#CC0000', secondaryColor: '#FFB81C' },
            { name: 'Wilmington', conference: 'Ohio Athletic Conference', mascot: 'Quakers', primaryColor: '#006747', secondaryColor: '#FFFFFF' },

            // Old Dominion Athletic Conference (ODAC)
            { name: 'Averett', conference: 'Old Dominion Athletic Conference', mascot: 'Cougars', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Bridgewater', conference: 'Old Dominion Athletic Conference', mascot: 'Eagles', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'Ferrum', conference: 'Old Dominion Athletic Conference', mascot: 'Panthers', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Guilford', conference: 'Old Dominion Athletic Conference', mascot: 'Quakers', primaryColor: '#8B0000', secondaryColor: '#FFFFFF' },
            { name: 'Hampden-Sydney', conference: 'Old Dominion Athletic Conference', mascot: 'Tigers', primaryColor: '#8B0000', secondaryColor: '#808080' },
            { name: 'Randolph-Macon', conference: 'Old Dominion Athletic Conference', mascot: 'Yellow Jackets', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Shenandoah', conference: 'Old Dominion Athletic Conference', mascot: 'Hornets', primaryColor: '#CC0000', secondaryColor: '#003087' },
            { name: 'Washington and Lee', conference: 'Old Dominion Athletic Conference', mascot: 'Generals', primaryColor: '#003087', secondaryColor: '#FFFFFF' },

            // Presidents' Athletic Conference (PAC)
            { name: 'Allegheny', conference: 'Presidents\' Athletic Conference', mascot: 'Gators', primaryColor: '#00205B', secondaryColor: '#FFB81C' },
            { name: 'Bethany', conference: 'Presidents\' Athletic Conference', mascot: 'Bison', primaryColor: '#006747', secondaryColor: '#FFFFFF' },
            { name: 'Carnegie Mellon', conference: 'Presidents\' Athletic Conference', mascot: 'Tartans', primaryColor: '#CC0000', secondaryColor: '#808080' },
            { name: 'Case Western Reserve', conference: 'Presidents\' Athletic Conference', mascot: 'Spartans', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Geneva', conference: 'Presidents\' Athletic Conference', mascot: 'Golden Tornadoes', primaryColor: '#FFB81C', secondaryColor: '#000000' },
            { name: 'Grove City', conference: 'Presidents\' Athletic Conference', mascot: 'Wolverines', primaryColor: '#8B0000', secondaryColor: '#FFFFFF' },
            { name: 'Saint Vincent', conference: 'Presidents\' Athletic Conference', mascot: 'Bearcats', primaryColor: '#006747', secondaryColor: '#FFB81C' },
            { name: 'Thiel', conference: 'Presidents\' Athletic Conference', mascot: 'Tomcats', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Washington & Jefferson', conference: 'Presidents\' Athletic Conference', mascot: 'Presidents', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Waynesburg', conference: 'Presidents\' Athletic Conference', mascot: 'Yellow Jackets', primaryColor: '#FFB81C', secondaryColor: '#000000' },
            { name: 'Westminster', conference: 'Presidents\' Athletic Conference', mascot: 'Titans', primaryColor: '#003087', secondaryColor: '#FFB81C' },

            // Southern Athletic Association (SAA)
            { name: 'Berry', conference: 'Southern Athletic Association', mascot: 'Vikings', primaryColor: '#003087', secondaryColor: '#FFB81C' },
            { name: 'Birmingham-Southern', conference: 'Southern Athletic Association', mascot: 'Panthers', primaryColor: '#000000', secondaryColor: '#FFB81C' },
            { name: 'Centre', conference: 'Southern Athletic Association', mascot: 'Colonels', primaryColor: '#FFB81C', secondaryColor: '#000000' },
            { name: 'Hendrix', conference: 'Southern Athletic Association', mascot: 'Warriors', primaryColor: '#FF8200', secondaryColor: '#000000' },
            { name: 'Millsaps', conference: 'Southern Athletic Association', mascot: 'Majors', primaryColor: '#461D7C', secondaryColor: '#FFFFFF' },
            { name: 'Rhodes', conference: 'Southern Athletic Association', mascot: 'Lynx', primaryColor: '#CC0000', secondaryColor: '#000000' },
            { name: 'Sewanee', conference: 'Southern Athletic Association', mascot: 'Tigers', primaryColor: '#582C83', secondaryColor: '#FFB81C' },

            // Southern California Intercollegiate Athletic Conference (SCIAC)
            { name: 'Cal Lutheran', conference: 'Southern California Intercollegiate Athletic Conference', mascot: 'Kingsmen', primaryColor: '#461D7C', secondaryColor: '#FFB81C' },
            { name: 'Chapman', conference: 'Southern California Intercollegiate Athletic Conference', mascot: 'Panthers', primaryColor: '#000000', secondaryColor: '#CC0000' },
            { name: 'Claremont-Mudd-Scripps', conference: 'Southern California Intercollegiate Athletic Conference', mascot: 'Stags', primaryColor: '#8B0000', secondaryColor: '#FFB81C' },
            { name: 'La Verne', conference: 'Southern California Intercollegiate Athletic Conference', mascot: 'Leopards', primaryColor: '#006747', secondaryColor: '#FFB81C' },
            { name: 'Occidental', conference: 'Southern California Intercollegiate Athletic Conference', mascot: 'Tigers', primaryColor: '#F47920', secondaryColor: '#000000' },
            { name: 'Pomona-Pitzer', conference: 'Southern California Intercollegiate Athletic Conference', mascot: 'Sagehens', primaryColor: '#003087', secondaryColor: '#FFB81C' },

            // St. Louis Intercollegiate Athletic Conference (SLIAC)
            { name: 'Greenville', conference: 'St. Louis Intercollegiate Athletic Conference', mascot: 'Panthers', primaryColor: '#F7941E', secondaryColor: '#000000' },

            // Wisconsin Intercollegiate Athletic Conference (WIAC)
            { name: 'Wisconsin-Whitewater', conference: 'Wisconsin Intercollegiate Athletic Conference', mascot: 'Warhawks', primaryColor: '#4F2683', secondaryColor: '#FFC82E' },

            // NAIA Conferences
            { name: 'Friends University', conference: 'Kansas Collegiate Athletic Conference', mascot: 'Falcons', primaryColor: '#98012E', secondaryColor: '#888B8D' },
            { name: 'Culver-Stockton', conference: 'Heart of America Athletic Conference', mascot: 'Wildcats', primaryColor: '#00205B', secondaryColor: '#FFFFFF' },
            // International
            { name: 'Manitoba', conference: 'U Sports', mascot: 'Bisons', primaryColor: '#783141', secondaryColor: '#FFB81C' },
            { name: 'British Columbia', conference: 'U Sports', mascot: 'Thunderbirds', primaryColor: '#002145', secondaryColor: '#97D4E9' },
            { name: 'Alberta', conference: 'U Sports', mascot: 'Golden Bears', primaryColor: '#007C41', secondaryColor: '#FFDB05' },

            // No College
            { name: 'No College', conference: 'No Conference', mascot: 'None', primaryColor: '#000000', secondaryColor: '#FFFFFF' }
        ];

        for (const college of fbsColleges) {
            if (college.conference) {
                await client.query(`
                    INSERT INTO college (college_name, conference_id, mascot, primary_color, secondary_color)
                    VALUES ($1, (SELECT conference_id FROM conference WHERE conference_name = $2), $3, $4, $5)
                    ON CONFLICT (college_name) DO NOTHING
                `, [college.name, college.conference, college.mascot, college.primaryColor, college.secondaryColor]);
            } else {
                // Handle independent schools
                await client.query(`
                    INSERT INTO college (college_name, mascot, primary_color, secondary_color)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT (college_name) DO NOTHING
                `, [college.name, college.mascot, college.primaryColor, college.secondaryColor]);
            }
        }

        const abilities = [
            // Pass Rush Abilities
            { name: 'Pass Lead Elite' },
            { name: 'Ankle Breaker' },
            { name: 'Double Me' },
            { name: 'Bazooka' },
            { name: 'Edge Protector' },
            { name: 'Enforcer' },
            { name: 'YAC Em Up' },
            { name: 'Dual Threat' },
            { name: 'Unstoppable Force' },
            { name: 'RAC Em Up' },
            { name: 'Blitz' },
            { name: 'Shutdown' },
            { name: 'Nasty Streak' },
            { name: 'Relentless' },
            { name: 'Screen Protector' },
            { name: 'Bottleneck' },
            { name: 'Pick Artist' },
            { name: 'Zone Run Free' },
            { name: 'Brick Wall' },
            { name: 'Wrecking Ball' },
            { name: 'Bulldozer' },
            { name: 'Post Up' },
            { name: 'Fearmonger' },
            { name: 'Fool Me Once' },
            { name: 'Lurker' },
            { name: 'Matchup Nightmare' },
            { name: 'Short Route KO' },
            { name: 'Deep Route KO' },
            { name: 'Inside Stuff' },
            { name: 'Puller Elite' },
            { name: 'Mid In Elite' },
            { name: 'Edge Threat' },
            { name: 'Outmatched' },
            { name: 'Deflator' },
            { name: 'TE Apprentice' },
            { name: 'No Outsiders' },
            { name: 'Arm Bar' },
            { name: 'All Day' },
            { name: 'Blind Side' },
            { name: 'Route Technician' },
            { name: 'Way Scrambler' },
            { name: 'Runoff Elite' },
            { name: 'Edge Elite' },
            { name: 'Tackle Supreme' },
            { name: 'Tip Drill' },
            { name: 'Run Stuffer' },
            { name: 'QB-O-Matic' },
            { name: 'Backfield Master' },
            { name: 'Evasive' },
            { name: 'Zone Breaker' },
            { name: 'Speedster' },
            { name: 'Anchored Extender' },
            { name: 'Fastbreak' },
            { name: 'Outside Shade' },
            { name: 'Elite' },
            { name: 'Short In Elite' },
            { name: 'Short Out Elite' },
            { name: 'Neutralizer' },
            { name: 'Dashing Deadeye' },
            { name: 'Deep Out Elite' },
            { name: 'Secure Tackler' },
            { name: 'Strip Specialist' },
            { name: 'Deep In Elite' },
            { name: 'Deep Threat Elite' },
            { name: 'Identifier' },
            { name: 'Natural Talent' },
            { name: 'One Step Ahead' },
            { name: 'Tip Drill' },
            { name: 'Sideline Deadeye' },
            { name: 'Bruiser' },
            { name: 'Apprentice' },
            { name: 'B.O.G.O.' },
            { name: 'Unfakeable' },
            { name: 'Out My Way' },
            { name: 'Reach For It' },
            { name: 'Red Zone KO' },
            { name: 'Red Zone Threat' },
            { name: 'Threat Detector' },
            { name: 'Inside Deadeye' },
            { name: 'Balance Beam' },
            { name: 'Route Apprentice' },
            { name: 'Clutch Kicker' },
            { name: 'Energizer' },
            { name: 'Lofting Deadeye' },
            { name: 'Outside Deadeye' },
            { name: 'Red Zone Deadeye' },
            { name: 'Steamroller' },
            { name: 'Goal Line Back' },
            { name: 'Gunslinger' },
            { name: 'Lurker' },
            { name: 'Pocket Deadeye' },
            { name: 'Roaming Deadeye' },
            { name: 'RR Double Up' },
            { name: 'Route Apprentice' },
            { name: 'Goal Line Stuff' },
            { name: 'Homer' },
            { name: 'Set Feet Lead' },
            { name: 'Slot-O-Matic' },
            { name: 'Hot Route Master' },
            { name: 'Lumber Jack' },
            { name: 'Extra Pro' }
        ];

        // Insert abilities
        for (const ability of abilities) {
            await client.query(
                'INSERT INTO ability (ability) VALUES ($1) ON CONFLICT (ability) DO NOTHING',
                [ability.name]
            );
        }

        // Archetypes
        const archetypes = [
            { name: 'Receiving Back - HB', description: 'Running back who excels in the passing game' },
            { name: 'Deep Threat - WR', description: 'Wide receiver specializing in long passing plays' },
            { name: 'Improviser - QB', description: 'Quarterback who can create plays outside the pocket' },
            { name: 'Vertical Threat - TE', description: 'Tight end who stretches the field vertically' },
            { name: 'Power - OT', description: 'Offensive tackle who excels in power blocking' },
            { name: 'Power Back - HB', description: 'Power-focused running back' },
            { name: 'Field General - MLB', description: 'Middle linebacker who controls defensive assignments' },
            { name: 'Possession - TE', description: 'Reliable catching tight end' },
            { name: 'Speed Rusher - OLB', description: 'Outside linebacker focused on pass rushing with speed' },
            { name: 'Power Rusher - DE', description: 'Defensive end who uses power moves' },
            { name: 'Power Rusher - DT', description: 'Defensive tackle who uses power moves' },
            { name: 'Zone - S', description: 'Safety who excels in zone coverage' },
            { name: 'Manto Man - CB', description: 'Cornerback who specializes in man coverage' },
            { name: 'Smaller Speed Rusher - DE', description: 'Undersized defensive end who relies on speed' },
            { name: 'Physical - WR', description: 'Wide receiver who plays a physical style' },
            { name: 'Slot - WR', description: 'Wide receiver who operates from the slot position' },
            { name: 'Pass Protector - OT', description: 'Offensive tackle who excels in pass protection' },
            { name: 'Elusive Back - HB', description: 'Running back who relies on elusiveness' },
            { name: 'Run Support - S', description: 'Safety who excels in run defense' },
            { name: 'Field General - QB', description: 'Quarterback who excels in pre-snap reads and adjustments' },
            { name: 'Power - G', description: 'Guard who excels in power blocking' },
            { name: 'Power - C', description: 'Center who excels in power blocking' },
            { name: 'Pass Protector - G', description: 'Guard who excels in pass protection' },
            { name: 'Run Stopper - DT', description: 'Defensive tackle who specializes in run defense' },
            { name: 'Agile - C', description: 'Center who excels in mobility and agility' },
            { name: 'Zone - CB', description: 'Cornerback who excels in zone coverage' },
            { name: 'Run Stopper - DE', description: 'Defensive end who specializes in run defense' },
            { name: 'Agile - G', description: 'Guard who excels in mobility and agility' },
            { name: 'Power Rusher - OLB', description: 'Outside linebacker who uses power moves' },
            { name: 'Agile - OT', description: 'Offensive tackle who excels in mobility' },
            { name: 'Run Stopper - MLB', description: 'Middle linebacker who specializes in run defense' },
            { name: 'Pass Coverage - OLB', description: 'Outside linebacker who excels in coverage' },
            { name: 'Slot - CB', description: 'Cornerback who specializes in covering slot receivers' },
            { name: 'Utility - FB', description: 'Fullback who contributes in multiple ways' },
            { name: 'Hybrid - S', description: 'Safety who can play multiple defensive back positions' },
            { name: 'Accurate - KP', description: 'Accurate kicker' },
            { name: 'Power - KP', description: 'Power-focused kicker' },
            { name: 'Speed Rusher - DT', description: 'Defensive tackle who relies on speed' },
            { name: 'Run Stopper - OLB', description: 'Outside linebacker who specializes in run defense' },
            { name: 'Pass Protector - C', description: 'Center who excels in pass protection' },
            { name: 'Scrambler - QB', description: 'Mobile quarterback who can extend plays' },
            { name: 'Blocking - FB', description: 'Fullback who specializes in blocking' },
            { name: 'Pass Coverage - MLB', description: 'Middle linebacker who excels in coverage' },
            { name: 'Blocking - TE', description: 'Tight end who specializes in blocking' }
        ];

        const archetypeResult = await client.query(`
            INSERT INTO archetype (archetype, description)
            VALUES ${archetypes.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
            ON CONFLICT (archetype) DO NOTHING
        `, archetypes.flatMap(a => [a.name, a.description]));

        results.push({
            table: 'archetype',
            rowCount: archetypeResult.rowCount
        });

        const heights = [
            // 5'4" - 5'8"
            {height_inches: 64, display_height: "5'4\""},
            {height_inches: 65, display_height: "5'5\""},
            {height_inches: 66, display_height: "5'6\""},
            {height_inches: 67, display_height: "5'7\""},
            {height_inches: 68, display_height: "5'8\""},
            // 5'9" - 5'11"
            {height_inches: 69, display_height: "5'9\""},
            {height_inches: 70, display_height: "5'10\""},
            {height_inches: 71, display_height: "5'11\""},
            // 6'0" - 6'8"
            {height_inches: 72, display_height: "6'0\""},
            {height_inches: 73, display_height: "6'1\""},
            {height_inches: 74, display_height: "6'2\""},
            {height_inches: 75, display_height: "6'3\""},
            {height_inches: 76, display_height: "6'4\""},
            {height_inches: 77, display_height: "6'5\""},
            {height_inches: 78, display_height: "6'6\""},
            {height_inches: 79, display_height: "6'7\""},
            {height_inches: 80, display_height: "6'8\""},
            // 6'9" - 7'0"
            {height_inches: 81, display_height: "6'9\""},
            {height_inches: 82, display_height: "6'10\""},
            {height_inches: 83, display_height: "6'11\""},
            {height_inches: 84, display_height: "7'0\""}
        ];

        const heightResult = await client.query(`
            INSERT INTO player_height (height_inches, display_height)
            VALUES ${heights.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
            ON CONFLICT (height_inches) DO NOTHING
        `, heights.flatMap(h => [h.height_inches, h.display_height]));

        results.push({
            table: 'player_height',
            rowCount: heightResult.rowCount
        });

        // Player Weights (150-400 lbs, incrementing by 1)
        const weights = Array.from({length: 251}, (_, i) => {
            const weightLbs = 150 + i;
            return {
                weight_lbs: weightLbs,
                display_weight: `${weightLbs} lbs`
            };
        });

        const weightResult = await client.query(`
            INSERT INTO player_weight (weight_lbs, display_weight)
            VALUES ${weights.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
            ON CONFLICT (weight_lbs) DO NOTHING
        `, weights.flatMap(w => [w.weight_lbs, w.display_weight]));

        results.push({
            table: 'player_weight',
            rowCount: weightResult.rowCount
        });

        // Player Ages (20-45 years)
        const ages = Array.from({length: 32}, (_, i) => {
            const ageYears = 18 + i;
            return {
                age_years: ageYears,
                display_age: `${ageYears} years`
            };
        });

        const ageResult = await client.query(`
            INSERT INTO player_age (age_years, display_age)
            VALUES ${ages.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
            ON CONFLICT (age_years) DO NOTHING
        `, ages.flatMap(a => [a.age_years, a.display_age]));

        results.push({
            table: 'player_age',
            rowCount: ageResult.rowCount
        });

        // Jersey Numbers (0-99)
        const jerseyNumbers = Array.from({length: 100}, (_, i) => ({
            number: i,
            display_number: i.toString()
        }));

        const jerseyNumberResult = await client.query(`
            INSERT INTO jersey_number (number, display_number)
            VALUES ${jerseyNumbers.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
            ON CONFLICT (number) DO NOTHING
        `, jerseyNumbers.flatMap(j => [j.number, j.display_number]));

        results.push({
            table: 'jersey_number',
            rowCount: jerseyNumberResult.rowCount
        });

        // Years Pro (0-25 years)
        const yearsPro = Array.from({length: 26}, (_, i) => ({
            years: i,
            display_years: i === 0 ? 'Rookie' : `${i} ${i === 1 ? 'year' : 'years'}`
        }));

        const yearsProResult = await client.query(`
            INSERT INTO years_pro (years, display_years)
            VALUES ${yearsPro.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
            ON CONFLICT (years) DO NOTHING
        `, yearsPro.flatMap(y => [y.years, y.display_years]));

        results.push({
            table: 'years_pro',
            rowCount: yearsProResult.rowCount
        });

        // Draft Types
        const draftTypes = [
            { name: 'Linear', description: 'Draft order is based on the team\'s overall pick order' },
            { name: 'Snake', description: 'Draft order is based on the team\'s overall pick order, but in a snake-like pattern' },
        ]

        for (const draftType of draftTypes) {
            await client.query(
                'INSERT INTO draft_type (type_name, description) VALUES ($1, $2) ON CONFLICT (type_name) DO NOTHING',
                [draftType.name, draftType.description]
            );
        }

        // Populate draft picks (54 rounds × 32 picks = 1,728 total picks)
        const draftPickResult = await client.query(`
            INSERT INTO draft_pick (round_number, pick_in_round, overall_pick, display_pick)
            VALUES ${Array.from({ length: 54 }, (_, round) => 
                Array.from({ length: 32 }, (_, pick) => {
                    const r = round + 1;
                    const p = pick + 1;
                    const overall = ((r - 1) * 32) + p;
                    return `(${r}, ${p}, ${overall}, 'Round ${r}, Pick ${p} (${overall} overall)')`;
                }).join(',\n')
            ).join(',\n')}
            ON CONFLICT (overall_pick) DO NOTHING
        `);

        results.push({
            table: 'draft_pick',
            rowCount: draftPickResult.rowCount
        });

        // Image Types
        const imageTypes = [
            { name: 'Portrait', description: 'Player headshot image' },
            { name: 'Action', description: 'Player in-game action shot' },
            { name: 'Logo', description: 'Team or college logo' },
            { name: 'Icon', description: 'Small icon representation' },
            { name: 'Uniform', description: 'Team uniform/jersey images' },
            { name: 'Stadium', description: 'Stadium or facility photos' },
            { name: 'Celebration', description: 'Team/player celebration moments' },
            { name: 'Banner', description: 'Wide promotional/header images' },
            { name: 'Thumbnail', description: 'Small preview images' },
            { name: 'Background', description: 'Full-width background images' },
            { name: 'Social', description: 'Social media optimized images' },
            { name: 'Mascot', description: 'Team mascot images' },
            { name: 'Historical', description: 'Archive/historical photos' },
            { name: 'Award', description: 'Trophy and award images' },
            { name: 'Chart', description: 'Statistical charts and graphics' },
            { name: 'Highlight', description: 'Key play or moment screenshots' }
        ];

        await client.query(`
            INSERT INTO image_type (type_name, description)
            VALUES ${imageTypes.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ')}
            ON CONFLICT (type_name) DO NOTHING
        `, imageTypes.flatMap(type => [type.name, type.description]));

        await client.query('COMMIT');

        console.log('Static data population completed successfully');
        console.log('Results:', results);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error populating static data:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the population script
populateStaticData()
    .then(() => {
        console.log('Script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });