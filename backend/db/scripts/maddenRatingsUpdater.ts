// src/services/maddenRatingsUpdater.ts

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { config } from '../../src/config';

interface PlayerAbility {
    id: string;
    label: string;
    description: string;
    imageUrl: string;
    type: {
      id: string;
      label: string;
      imageUrl: string;
      iconUrl: string;
    };
  }

// Update the interface to match the API response
interface PlayerPosition {
    id: string;      // This is the short label (e.g., "HB")
    label: string;   // This is the full name (e.g., "Halfback")
    positionType: {
      id: string;
      name: string;
    };
  }

  interface PlayerArchetype {
    id: string;    // e.g., "HB_ReceivingBack"
    label: string; // e.g., "Receiving Back - HB"
  }

interface PlayerStats {
  [key: string]: {
    value: number | string;
    diff: number;
  };
}

export interface PlayerData {
  id: number;
  overallRating: number;
  firstName: string;
  lastName: string;
  height: number;
  weight: number;
  college: string;
  handedness: number;
  age: number;
  jerseyNum: number;
  yearsPro: number;
  playerAbilities: PlayerAbility[];
  archetype: PlayerArchetype;
  team: {
    id: number;
    label: string;
  };
  position: PlayerPosition;
  iteration: {
    id: string;
    label: string;
  };
  stats: PlayerStats;
}

interface ProcessedPlayer {
  playerId: number;
  firstName: string;
  lastName: string;
  heightId: number;
  weightId: number;
  ageId: number;
  collegeId: number | null;
  handednessId: number;
  jerseyNumberId: number;
  yearsProId: number;
  positionId: number;
  teamId: number;
  abilities: string[];
  archetype: PlayerArchetype | null;
  stats: PlayerStats;
  iterationId: string;
}

class MaddenRatingsUpdater {
    private pool: Pool;
    private baseUrl: string;

    constructor() {
        this.pool = new Pool({
          ...config.database,
          // Add these for debugging
          connectionTimeoutMillis: 5000,
          query_timeout: 10000
        });
    
        // Add error handler for the pool
        this.pool.on('error', (err) => {
          console.error('Unexpected error on idle client', err);
          process.exit(-1);
        });
    
        this.baseUrl = 'https://drop-api.ea.com/rating/madden-nfl';
      }

      private async fetchLatestRatings(): Promise<PlayerData[]> {
        try {
          const currentIteration = await this.getCurrentIteration();
          const iterationDir = path.join(__dirname, '..', 'iterations');
          const iterationFile = path.join(iterationDir, `${currentIteration}.json`);
      
          // Check if we already have this iteration saved
          if (fs.existsSync(iterationFile)) {
            console.log(`Loading iteration ${currentIteration} from cache...`);
            const cachedData = JSON.parse(fs.readFileSync(iterationFile, 'utf-8'));
            return cachedData;
          }
      
          // Only reaches this point if we need to fetch from EA
          console.log(`Fetching iteration ${currentIteration} from EA...`);
          let allPlayers: PlayerData[] = [];
          let offset = 0;
          const limit = 100;
          
          while (true) {
            console.log(`Fetching players ${offset} to ${offset + limit}...`);
            
            const response = await axios.get(this.baseUrl, {
              params: {
                locale: 'en',
                limit: limit,
                offset: offset,
                iteration: currentIteration
              },
              headers: {
                'referer': 'https://www.ea.com/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'origin': 'https://www.ea.com',
                'accept': 'application/json'
              }
            });
      
            if (!response.data?.items) {
              throw new Error('Invalid response format from EA API');
            }
      
            const players = response.data.items;
            if (players.length === 0) {
              break;
            }
      
            allPlayers = [...allPlayers, ...players];
            offset += limit;
      
            // Only need the delay when fetching from EA
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
      
          // Save the fetched data
          if (!fs.existsSync(iterationDir)) {
            fs.mkdirSync(iterationDir, { recursive: true });
          }
          fs.writeFileSync(iterationFile, JSON.stringify(allPlayers, null, 2));
          console.log(`Saved iteration ${currentIteration} to ${iterationFile}`);
      
          return allPlayers;
        } catch (error) {
            if (axios.isAxiosError(error)) {
              console.error('API Error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data
              });
            }
            throw error;
          }
        }

  private async getLatestIterationFromDb(): Promise<string> {
    const query = `
      SELECT iteration_name 
      FROM rating_iteration 
      ORDER BY iteration_date DESC 
      LIMIT 1
    `;
    
    const result = await this.pool.query(query);
    return result.rows[0]?.iteration_name;
  }

  private async getCurrentIteration(): Promise<string> {
    try {
      const response = await axios.get('https://www.ea.com/games/madden-nfl/ratings', {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      // Extract iteration from the page HTML
      const match = response.data.match(/iteration=([^"&]+)/);
      if (match && match[1]) {
        return match[1];
      }
      
      // Fallback to default
      return '12-week-11';
    } catch (error) {
      console.error('Error getting current iteration:', error);
      return '12-week-11'; // Fallback to default
    }
  }

  private parseIterationId(iterationId: string): { seasonYear: number; weekNumber: number } {
    // Handle format like "12-week-11"
    const match = iterationId.match(/(\d+)-week-(\d+)/);
    if (!match) {
      throw new Error(`Invalid iteration ID format: ${iterationId}`);
    }
  
    const seasonYear = parseInt(match[1]);
    const weekNumber = parseInt(match[2]);
  
    if (isNaN(seasonYear) || isNaN(weekNumber)) {
      throw new Error(`Failed to parse iteration values: ${iterationId}`);
    }
  
    return {
      seasonYear,
      weekNumber
    };
  }

  private async createNewIteration(iterationId: string): Promise<number> {
    const query = `
      INSERT INTO rating_iteration (
        iteration_name, 
        iteration_date, 
        season_year, 
        week_number, 
        is_regular_season
      ) 
      VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4)
      RETURNING iteration_id
    `;
  
    try {
      const { seasonYear, weekNumber } = this.parseIterationId(iterationId);
  
      const result = await this.pool.query(query, [
        iterationId,
        seasonYear,
        weekNumber,
        true    // is_regular_season
      ]);
  
      return result.rows[0].iteration_id;
    } catch (error) {
      console.error('Error creating new iteration:', {
        iterationId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async processPlayer(player: PlayerData): Promise<ProcessedPlayer> {
    const playerName = `${player.firstName} ${player.lastName}`;
  
    try {
      const [heightId, weightId, ageId, handednessId, jerseyNumberId, yearsProId, positionId, teamId, collegeId, archetypeId] = 
        await Promise.all([
            this.getHeightId(player.height),
            this.getWeightId(player.weight),
            this.getAgeId(player.age),
            this.getHandednessId(player.handedness),
            this.getJerseyNumberId(Number(player.jerseyNum)),
            this.getYearsProId(Number(player.yearsPro)), 
            this.getPositionId(player.position),
            this.getTeamId(player.team.label),
            this.getCollegeId(player.college, playerName),  // Pass player name here
            this.getArchetypeId(player.archetype)
        ]);
  
      return {
        playerId: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        heightId,
        weightId,
        ageId,
        collegeId,
        handednessId,
        jerseyNumberId,
        yearsProId,
        positionId,
        teamId,
        abilities: player.playerAbilities.map(ability => ability.label),
        archetype: player.archetype || null,
        stats: player.stats,
        iterationId: player.iteration.id
      };
    } catch (error) {
      console.error('Error processing player:', {
        name: `${player.firstName} ${player.lastName}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async updatePlayerRatings(player: ProcessedPlayer, iterationId: number): Promise<void> {
    const client = await this.pool.connect();
    
    try {
        await client.query('BEGIN');
    
        // Get the style_id for the player's running style
        const runningStyleQuery = `
          SELECT style_id 
          FROM running_style 
          WHERE style_name = $1
        `;
        const styleResult = await client.query(runningStyleQuery, [player.stats.runningStyle?.value || 'None']);
        const styleId = styleResult.rows[0]?.style_id;

      // Update player table
      const playerQuery = `
        INSERT INTO player (
          player_id, first_name, last_name, height_id, weight_id, 
          age_id, college_id, handedness_id, jersey_number_id, 
          years_pro_id, position_id, team_id
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (player_id) 
        DO UPDATE SET
          height_id = EXCLUDED.height_id,
          weight_id = EXCLUDED.weight_id,
          age_id = EXCLUDED.age_id,
          college_id = EXCLUDED.college_id,
          handedness_id = EXCLUDED.handedness_id,
          jersey_number_id = EXCLUDED.jersey_number_id,
          years_pro_id = EXCLUDED.years_pro_id,
          position_id = EXCLUDED.position_id,
          team_id = EXCLUDED.team_id
      `;

      await client.query(playerQuery, [
        player.playerId,
        player.firstName,
        player.lastName,
        player.heightId,
        player.weightId,
        player.ageId,
        player.collegeId,
        player.handednessId,
        player.jerseyNumberId,
        player.yearsProId,
        player.positionId,
        player.teamId
      ]);

      const stats = player.stats;
      const ratingValues = [
        player.playerId,
        iterationId,
        1, // development_trait_id
        styleId,
        stats.overall?.value || 0,
        stats.acceleration?.value || 0,
        stats.agility?.value || 0,
        stats.jumping?.value || 0,
        stats.stamina?.value || 0,
        stats.strength?.value || 0,
        stats.awareness?.value || 0,
        stats.bCVision?.value || 0,
        stats.blockShedding?.value || 0,        // Changed from block_shedding
        stats.breakSack?.value || 0,            // Changed from break_sack
        stats.breakTackle?.value || 0,          // Changed from break_tackle
        stats.carrying?.value || 0,
        stats.catchInTraffic?.value || 0,       // Changed from catch_in_traffic
        stats.catching?.value || 0,
        stats.changeOfDirection?.value || 0,     // Changed from change_of_direction
        stats.deepRouteRunning?.value || 0,     // Changed from deep_route_running
        stats.finesseMoves?.value || 0,         // Changed from finesse_moves
        stats.hitPower?.value || 0,             // Changed from hit_power
        stats.impactBlocking?.value || 0,       // Changed from impact_blocking
        stats.injury?.value || 0,
        stats.jukeMove?.value || 0,             // Changed from juke_move
        stats.kickAccuracy?.value || 0,         // Changed from kick_accuracy
        stats.kickPower?.value || 0,            // Changed from kick_power
        stats.kickReturn?.value || 0,           // Changed from kick_return
        stats.leadBlock?.value || 0,            // Changed from lead_block
        stats.manCoverage?.value || 0,          // Changed from man_coverage
        stats.mediumRouteRunning?.value || 0,   // Changed from medium_route_running
        stats.passBlock?.value || 0,            // Changed from pass_block
        stats.passBlockFinesse?.value || 0,     // Changed from pass_block_finesse
        stats.passBlockPower?.value || 0,       // Changed from pass_block_power
        stats.playAction?.value || 0,           // Changed from play_action
        stats.playRecognition?.value || 0,      // Changed from play_recognition
        stats.powerMoves?.value || 0,           // Changed from power_moves
        stats.press?.value || 0,
        stats.pursuit?.value || 0,
        stats.release?.value || 0,
        stats.runBlock?.value || 0,             // Changed from run_block
        stats.runBlockFinesse?.value || 0,      // Changed from run_block_finesse
        stats.runBlockPower?.value || 0,        // Changed from run_block_power
        stats.shortRouteRunning?.value || 0,    // Changed from short_route_running
        stats.spectacularCatch?.value || 0,     // Changed from spectacular_catch
        stats.speed?.value || 0,
        stats.spinMove?.value || 0,             // Changed from spin_move
        stats.stiffArm?.value || 0,             // Changed from stiff_arm
        stats.tackle?.value || 0,
        stats.throwAccuracyDeep?.value || 0,    // Changed from throw_accuracy_deep
        stats.throwAccuracyMid?.value || 0,     // Changed from throw_accuracy_mid
        stats.throwAccuracyShort?.value || 0,   // Changed from throw_accuracy_short
        stats.throwOnTheRun?.value || 0,        // Changed from throw_on_the_run
        stats.throwPower?.value || 0,           // Changed from throw_power
        stats.throwUnderPressure?.value || 0,   // Changed from throw_under_pressure
        stats.toughness?.value || 0,
        stats.trucking?.value || 0,
        stats.zoneCoverage?.value || 0          // Changed from zone_coverage
      ];

      // Insert player rating
      const ratingQuery = `
        INSERT INTO player_rating (
            player_id, iteration_id, development_trait_id, style_id, overall,
            acceleration, agility, jumping, stamina, strength, awareness,
            bcvision, block_shedding, break_sack, break_tackle, carrying,
            catch_in_traffic, catching, change_of_direction, deep_route_running,
            finesse_moves, hit_power, impact_blocking, injury, juke_move,
            kick_accuracy, kick_power, kick_return, lead_block, man_coverage,
            medium_route_running, pass_block, pass_block_finesse, pass_block_power,
            play_action, play_recognition, power_moves, press, pursuit, release,
            run_block, run_block_finesse, run_block_power, short_route_running,
            spectacular_catch, speed, spin_move, stiff_arm, tackle,
            throw_accuracy_deep, throw_accuracy_mid, throw_accuracy_short,
            throw_on_the_run, throw_power, throw_under_pressure, toughness,
            trucking, zone_coverage
        )
        VALUES (${ratingValues.map((_, i) => `$${i + 1}`).join(', ')})
        `;
    
        if (Array.isArray(player.abilities)) {
            // Insert new abilities for this iteration
            for (const ability of player.abilities) {    
            const abilityQuery = `
                INSERT INTO player_ability (player_id, ability_id, iteration_id)
                SELECT $1, ability_id, $3
                FROM ability 
                WHERE ability = $2
                RETURNING *
            `;
    
            const result = await client.query(abilityQuery, [
                player.playerId,
                ability,
                iterationId
            ]);
            }
        }
    
        const archetypeId = await this.getArchetypeId(player.archetype);
    
        const archetypeQuery = `
            INSERT INTO player_archetype (player_id, archetype_id, iteration_id)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
    
        const archetypeResult = await client.query(archetypeQuery, [
            player.playerId,
            archetypeId,
            iterationId
        ]);


        await client.query(ratingQuery, ratingValues);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating player ratings:', {
          name: `${player.firstName} ${player.lastName}`,
          error: error instanceof Error ? error.message : 'Unknown error',
          stats: player.stats // Log stats on error
        });
        throw error;
      } finally {
        client.release();
      }
    }

  public async run(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const players = await this.fetchLatestRatings();
      const latestIteration = players[0]?.iteration.id;
      
      if (!latestIteration) {
        console.log('No data received');
        return;
      }
  
      const currentIteration = await this.getLatestIterationFromDb();
      
      if (latestIteration === currentIteration) {
        console.log('Ratings are already up to date');
        return;
      }
  
      const iterationId = await this.createNewIteration(latestIteration);
  
      for (const player of players) {
        const processedPlayer = await this.processPlayer(player);
        await this.updatePlayerRatings(processedPlayer, iterationId);
      }
  
      await client.query('COMMIT');
      console.log(`Successfully updated ratings to iteration: ${latestIteration}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating ratings:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }

  private readonly teamNameMapping: { [key: string]: string } = {
    'NY Giants': 'New York Giants',
    'NY Jets': 'New York Jets',
    'LA Rams': 'Los Angeles Rams',
    'LA Chargers': 'Los Angeles Chargers',
    'KC Chiefs': 'Kansas City Chiefs',
    'TB Buccaneers': 'Tampa Bay Buccaneers',
    'NE Patriots': 'New England Patriots',
    'GB Packers': 'Green Bay Packers',
    'SF 49ers': 'San Francisco 49ers',
    'NO Saints': 'New Orleans Saints',
    'JAX Jaguars': 'Jacksonville Jaguars',  // Just in case they use this
    'LV Raiders': 'Las Vegas Raiders'
  };

  private async getHeightId(heightInches: number): Promise<number> {
    if (isNaN(heightInches)) {
      throw new Error(`Invalid height: ${heightInches}`);
    }
  
    const result = await this.pool.query(
      'SELECT height_id FROM player_height WHERE height_inches = $1',
      [heightInches]
    );
  
    if (!result.rows[0]) {
      const displayHeight = `${Math.floor(heightInches/12)}'${heightInches%12}"`;
      const insertResult = await this.pool.query(
        'INSERT INTO player_height (height_inches, display_height) VALUES ($1, $2) RETURNING height_id',
        [heightInches, displayHeight]
      );
      return insertResult.rows[0].height_id;
    }
  
    return result.rows[0].height_id;
  }
  
  private async getWeightId(weightLbs: number): Promise<number> {
    if (isNaN(weightLbs)) {
      throw new Error(`Invalid weight: ${weightLbs}`);
    }
  
    const result = await this.pool.query(
      'SELECT weight_id FROM player_weight WHERE weight_lbs = $1',
      [weightLbs]
    );
  
    if (!result.rows[0]) {
      const displayWeight = `${weightLbs} lbs`;
      const insertResult = await this.pool.query(
        'INSERT INTO player_weight (weight_lbs, display_weight) VALUES ($1, $2) RETURNING weight_id',
        [weightLbs, displayWeight]
      );
      return insertResult.rows[0].weight_id;
    }
  
    return result.rows[0].weight_id;
  }
  
  private async getAgeId(ageYears: number): Promise<number> {
    if (isNaN(ageYears)) {
      throw new Error(`Invalid age: ${ageYears}`);
    }
  
    const result = await this.pool.query(
      'SELECT age_id FROM player_age WHERE age_years = $1',
      [ageYears]
    );
  
    if (!result.rows[0]) {
      const displayAge = `${ageYears} yrs`;
      const insertResult = await this.pool.query(
        'INSERT INTO player_age (age_years, display_age) VALUES ($1, $2) RETURNING age_id',
        [ageYears, displayAge]
      );
      return insertResult.rows[0].age_id;
    }
  
    return result.rows[0].age_id;
  }
  
  private async getJerseyNumberId(jerseyNum: number): Promise<number> {
    if (isNaN(jerseyNum)) {
      throw new Error(`Invalid jersey number: ${jerseyNum}`);
    }
  
    const result = await this.pool.query(
      'SELECT jersey_number_id FROM jersey_number WHERE number = $1',
      [jerseyNum]
    );
  
    if (!result.rows[0]) {
      const displayNumber = jerseyNum.toString().padStart(2, '0');
      const insertResult = await this.pool.query(
        'INSERT INTO jersey_number (number, display_number) VALUES ($1, $2) RETURNING jersey_number_id',
        [jerseyNum, displayNumber]
      );
      return insertResult.rows[0].jersey_number_id;
    }
  
    return result.rows[0].jersey_number_id;
  }
  
  private async getYearsProId(years: number): Promise<number> {
    if (isNaN(years)) {
      throw new Error(`Invalid years pro: ${years}`);
    }
  
    const result = await this.pool.query(
      'SELECT years_pro_id FROM years_pro WHERE years = $1',
      [years]
    );
  
    if (!result.rows[0]) {
      const displayYears = years === 0 ? 'Rookie' : `${years} years`;
      const insertResult = await this.pool.query(
        'INSERT INTO years_pro (years, display_years) VALUES ($1, $2) RETURNING years_pro_id',
        [years, displayYears]
      );
      return insertResult.rows[0].years_pro_id;
    }
  
    return result.rows[0].years_pro_id;
  }
  
  private async getTeamId(teamLabel: string): Promise<number> {
    // Map the team name if it exists in our mapping, otherwise use the original
    const mappedTeamName = this.teamNameMapping[teamLabel] || teamLabel;
  
    const result = await this.pool.query(
      'SELECT team_id FROM team WHERE team_label = $1',
      [mappedTeamName]
    );
  
    if (!result.rows[0]) {
      throw new Error(`Team not found: ${teamLabel} (mapped to: ${mappedTeamName})`);
    }
  
    return result.rows[0].team_id;
  }
  
  private async getPositionId(position: PlayerPosition): Promise<number> {
    const result = await this.pool.query(
      'SELECT position_id FROM position WHERE position = $1',
      [position.id]  // Using id (e.g., "HB") instead of label (e.g., "Halfback")
    );
  
    if (!result.rows[0]) {
      throw new Error(`Position not found: ${position.id} (${position.label})`);
    }
  
    return result.rows[0].position_id;
  }

  private async getHandednessId(handedness: number): Promise<number> {
    const handednessLabel = handedness === 0 ? 'Left' : 'Right';  // Changed: 0 is Left, 1 is Right
  
    const result = await this.pool.query(
      'SELECT handedness_id FROM handedness WHERE handedness = $1',
      [handednessLabel]
    );
  
    if (!result.rows[0]) {
      throw new Error(`Handedness not found: ${handednessLabel} (value: ${handedness})`);
    }
  
    return result.rows[0].handedness_id;
  }

  private readonly collegeNameMapping: { [key: string]: string } = {
    // SEC
    'Mississippi St.': 'Mississippi State',
    'Ole Miss': 'Mississippi',
    'Texas A&M': 'Texas A&M',
    'Texas AM': 'Texas A&M',
  
    // Common abbreviations
    'Miami (FL)': 'Miami',
    'Valdosta St.': 'Valdosta State',
    'Mid Tenn St.': 'Middle Tennessee',
    'Alabama St.': 'Alabama State',
    'Alcorn St.': 'Alcorn State',
    'Appalach. St.': 'Appalachian State',
    'Arizona St.': 'Arizona State',
    'Arkansas St.': 'Arkansas State',
    'Arkansas P.B.': 'Arkansas–Pine Bluff',
    'Bowling Green St.': 'Bowling Green',
    'California-Davis': 'UC Davis',
    'Campbell Univ.': 'Campbell',
    'Colorado St.': 'Colorado State',
    'CSU-Pueblo': 'CSU Pueblo',
    'Connecticut': 'UConn',
    'East Central Univ.': 'East Central',
    'E. Illinois': 'Eastern Illinois',
    'E. Kentucky': 'Eastern Kentucky',
    'Eastern Wash.': 'Eastern Washington',
    'Elon University': 'Elon',
    'Florida AM': 'Florida A&M',
    'Ga. Southern': 'Georgia Southern',
    'Grambling St.': 'Grambling State',
    'Grand Valley St.': 'Grand Valley State',
    'Greenville College': 'Greenville', 
    'Hawaii': 'Hawaiʻi',
    'Houston Baptist': 'Houston Christian',
    'Humboldt St.': 'Cal Poly Humboldt',
    'Humboldt State': 'Cal Poly Humboldt',
    'Illinois St.': 'Illinois State',
    'IUP': 'Indiana (PA)',
    'Jackson St.': 'Jackson State',
    'J. Madison': 'James Madison',
    'LA Tech': 'Louisiana Tech',
    'LA. Tech': 'Louisiana Tech',
    'Lenoir-Rhyne University': 'Lenoir-Rhyne',
    'Malone University': 'Malone',
    'Massachusetts' : 'UMass',
    'Miami Univ.': 'Miami (OH)',
    'Miami (OH)': 'Miami (Ohio)',
    'Michigan St.': 'Michigan State',
    'Minnesota State': 'Minnesota State-Mankato',
    'Missouri W State': 'Missouri Western',
    'Missouri University of Science and Technology': 'Missouri S&T',
    'Missouri University of Science & Technology': 'Missouri S&T',
    'None': 'No College',
    'N.C. AT': 'North Carolina A&T',
    'NC Central': 'North Carolina Central',
    'NC State': 'North Carolina State',
    'N.C. State': 'NC State', 
    'North Dakota St.': 'North Dakota State',
    'N. Arizona': 'Northern Arizona',
    'N. Colorado': 'Northern Colorado',
    'N. Illinois': 'Northern Illinois',
    'Oklahoma St.': 'Oklahoma State',
    'Pittsburg St.': 'Pittsburg State',
    'P. View AM': 'Prairie View A&M',
    'Saginaw Valley': 'Saginaw Valley State',
    "St. John's": "Saint John's", 
    'San Diego St.': 'San Diego State',
    'San Jose St.': 'San Jose State',
    'Shepherd Univ.': 'Shepherd',
    'S. Dakota St.': 'South Dakota State',
    'S.C. State': 'South Carolina State',
    'SE Missouri St.': 'Southeast Missouri State',
    'S. Illinois': 'Southern Illinois',
    'Tenn-Chat': 'Chattanooga',
    'Tenn-Martin': 'UT Martin',
    'Texas AM-Commerce': 'Texas A&M-Commerce',
    'Tusculum College': 'Tusculum',
    'UL Monroe': 'Louisiana-Monroe',
    'UL Lafayette': 'Louisiana',
    'UTSA': 'Texas-San Antonio',
    'UAB': 'Alabama-Birmingham',
    'UBC': 'British Columbia',
    'UCF': 'Central Florida',
    'USC': 'Southern California',
    'USF': 'South Florida',
    'UCLA': 'California-Los Angeles',
    'University of Charleston': 'Charleston',
    'UNLV': 'Nevada-Las Vegas',
    'Wagner College': 'Wagner',
    'Wash. St.': 'Washington State',
    'W. Illinois': 'Western Illinois',
    'W. Kentucky': 'Western Kentucky',
    'W. Michigan': 'Western Michigan',
    'William  Mary': 'William & Mary',
    'Wisc-Whitewater': 'Wisconsin-Whitewater',
    'Youngstown St.': 'Youngstown State',
    'SMU': 'Southern Methodist',
    'TCU': 'Texas Christian',
    'LSU': 'Louisiana State',
    'FIU': 'Florida International',
    'FAU': 'Florida Atlantic',
    'BYU': 'Brigham Young',
    'Cal': 'California',
    'UConn': 'Connecticut',
    'UMass': 'Massachusetts',
    'UTEP': 'Texas-El Paso'
  };

  private readonly playerCollegeOverrides: { [key: string]: string } = {
    'Grover Stewart': 'Albany State',
    'Jalyx Hunt': 'Cornell',
    'Dondrea Tillman': 'Indiana (PA)',
    'Kameron Johnson': 'Barton',
    
    // Add other player-specific overrides here as needed
  };
  
  private async getCollegeId(collegeName: string, playerName?: string): Promise<number> {
    // Check player-specific override first
    if (playerName && this.playerCollegeOverrides[playerName]) {
      const overrideCollege = this.playerCollegeOverrides[playerName];
      const result = await this.pool.query(
        'SELECT college_id FROM college WHERE college_name = $1',
        [overrideCollege]
      );
      if (result.rows[0]) {
        return result.rows[0].college_id;
      }
    }
  
    // Try with original name first
    let result = await this.pool.query(
      'SELECT college_id FROM college WHERE college_name = $1',
      [collegeName]
    );
  
    // If not found, try the mapping
    if (!result.rows[0] && this.collegeNameMapping[collegeName]) {
      const mappedCollegeName = this.collegeNameMapping[collegeName];
      result = await this.pool.query(
        'SELECT college_id FROM college WHERE college_name = $1',
        [mappedCollegeName]
      );
    }
  
    if (!result.rows[0]) {
      throw new Error(`College not found: ${collegeName} (mapped to: ${this.collegeNameMapping[collegeName] || 'no mapping found'})`);
    }
  
    return result.rows[0].college_id;
  }

  private async getArchetypeId(archetype: PlayerArchetype | null): Promise<number> {
    const archetypeLabel = archetype?.label || 'None';
  
    const result = await this.pool.query(
      'SELECT archetype_id FROM archetype WHERE archetype = $1',
      [archetypeLabel]
    );
  
    if (!result.rows[0]) {
      console.error(`Archetype not found in database:`, {
        label: archetypeLabel,
        originalArchetype: archetype
      });
      throw new Error(`Archetype not found: ${archetypeLabel}`);
    }
  
    return result.rows[0].archetype_id;
  }


  // Implement similar methods for other lookup tables...
}

export default MaddenRatingsUpdater;