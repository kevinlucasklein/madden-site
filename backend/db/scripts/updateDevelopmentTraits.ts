import { Pool } from 'pg';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { config } from '../../src/config';
import { PlayerData } from './maddenRatingsUpdater';  // Import the interfaces

interface MaddenToolsPlayer {
  roster_id: string;
  first_name: string;
  last_name: string;
  position: string;
  height: number;
  weight: number;
  age: number;
  years_pro: number;
  trait_development: number;
}



class DevelopmentTraitUpdater {
  private pool: Pool;
  private baseUrl: string;

  constructor() {
    this.pool = new Pool({
      ...config.database,  // Use config.database to match maddenRatingsUpdater
      connectionTimeoutMillis: 5000,
      query_timeout: 10000
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    this.baseUrl = 'https://static.madden.tools/madden-25/json/iterations';
  }

  private readonly developmentTraitMap: { [key: number]: number } = {
    0: 1,  // Normal
    1: 2,  // Star
    2: 3,  // Superstar
    3: 4   // X-Factor
    // Adjust these numbers based on your actual development_trait table IDs
  };
  
    private async getIterationData(iterationId: number): Promise<any[]> {
        try {
        const weekNumber = await this.getCurrentWeek();
        const iterationsDir = path.join(__dirname, '..', 'iterations');
        
        // Debug: Check if directory exists
        if (!fs.existsSync(iterationsDir)) {
            console.error('Iterations directory not found:', iterationsDir);
            throw new Error('Iterations directory not found');
        }
    
        // Look for file matching pattern: 12-week-11.json
        const matchingFile = fs.readdirSync(iterationsDir)
            .find(file => file.includes(`week-${weekNumber}`));
    
        if (!matchingFile) {
            throw new Error(`No EA data file found for week ${weekNumber} in ${iterationsDir}`);
        }
    
        const iterationFile = path.join(iterationsDir, matchingFile);
        console.log(`Loading EA iteration data from ${iterationFile}`);
        
        const data = JSON.parse(fs.readFileSync(iterationFile, 'utf-8'));
        return data;
        } catch (error: unknown) {
            const err = error as Error;
            console.error('Error loading EA iteration data:', {
                error: err.message,
                weekNumber: await this.getCurrentWeek(),
                searchPath: path.join(__dirname, '..', 'iterations')
            });
            throw error;
        }
    }

    private async getCurrentWeek(): Promise<string> {
        try {
          const iterationsDir = path.join(__dirname, '..', 'iterations');
          const files = fs.readdirSync(iterationsDir);
          
          // Filter for valid iteration files and sort them
          const iterationFiles = files
            .filter(f => f.match(/\d+-week-\d+\.json/))
            .sort((a, b) => {
              // Extract iteration and week numbers
              const [iterA, weekA] = a.match(/(\d+)-week-(\d+)/)?.slice(1) || [];
              const [iterB, weekB] = b.match(/(\d+)-week-(\d+)/)?.slice(1) || [];
              
              // Convert to numbers for proper comparison
              const iterationA = parseInt(iterA);
              const iterationB = parseInt(iterB);
              const weekNumA = parseInt(weekA);
              const weekNumB = parseInt(weekB);
      
              // Sort by iteration first, then week number
              if (iterationA !== iterationB) {
                return iterationB - iterationA; // Higher iteration = more recent
              }
              return weekNumB - weekNumA; // Higher week = more recent
            });
      
          const latestFile = iterationFiles[0]; // Get the first (most recent) file
      
          if (!latestFile) {
            throw new Error('No EA iteration files found');
          }
      
          // Extract week number from filename
          const weekMatch = latestFile.match(/week-(\d+)/);
          if (!weekMatch) {
            throw new Error(`Could not extract week number from filename: ${latestFile}`);
          }
      
          return weekMatch[1];
        } catch (error) {
          console.error('Error getting current week:', error);
          throw error;
        }
      }
    
      private async fetchMaddenToolsData(): Promise<any[]> {
        try {
          const weekNumber = await this.getCurrentWeek();
          const iterationDir = path.join(__dirname, '..', 'maddentools_iterations');
          const iterationFile = path.join(iterationDir, `mt-week-${weekNumber}.json`);
      
          if (fs.existsSync(iterationFile)) {
            console.log(`Loading MaddenTools week ${weekNumber} from cache...`);
            return JSON.parse(fs.readFileSync(iterationFile, 'utf-8'));
          }
      
          console.log(`Fetching week ${weekNumber} from MaddenTools...`);
          const response = await axios.get(`${this.baseUrl}/${weekNumber}/players.json`, {
            headers: {
              'referer': 'https://madden.tools/',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'accept': 'application/json'
            }
          });
      
          if (!fs.existsSync(iterationDir)) {
            fs.mkdirSync(iterationDir, { recursive: true });
          }
          fs.writeFileSync(iterationFile, JSON.stringify(response.data, null, 2));
          console.log(`Saved MaddenTools week ${weekNumber} to ${iterationFile}`);
      
          return response.data;
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error('MaddenTools API Error:', {
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data
            });
          }
          throw error;
        }
      }
    

  private isExactMatch(eaPlayer: PlayerData, mtPlayer: MaddenToolsPlayer): boolean {
    // All conditions must match exactly
    return (
      eaPlayer.firstName.toLowerCase() === mtPlayer.first_name.toLowerCase() &&
      eaPlayer.lastName.toLowerCase() === mtPlayer.last_name.toLowerCase() &&
      eaPlayer.position.id === mtPlayer.position &&
      eaPlayer.height === mtPlayer.height &&
      eaPlayer.weight === mtPlayer.weight &&
      eaPlayer.age === mtPlayer.age &&
      eaPlayer.yearsPro === mtPlayer.years_pro
    );
  }
  
  private async updateDevelopmentTraits(iterationId: number): Promise<void> {
    const maddenToolsData = await this.fetchMaddenToolsData();
    const eaData = await this.getIterationData(iterationId);
    
    const exactMatches: Array<{playerId: number, devTrait: number}> = [];
    const unmatchedPlayers: Array<string> = [];
    
    for (const eaPlayer of eaData) {
      const match = maddenToolsData.find(mtPlayer => this.isExactMatch(eaPlayer, mtPlayer));
      
      if (match) {
        // Map the trait_development value to your database ID
        const mappedTraitId = this.developmentTraitMap[match.trait_development];
        
        if (mappedTraitId === undefined) {
          console.warn(`Unknown development trait value: ${match.trait_development} for player ${eaPlayer.firstName} ${eaPlayer.lastName}`);
          continue;
        }
  
        exactMatches.push({
          playerId: eaPlayer.id,
          devTrait: mappedTraitId  // Use the mapped ID
        });
      } else {
        unmatchedPlayers.push(`${eaPlayer.firstName} ${eaPlayer.lastName} (${eaPlayer.position.id})`);
      }
    }
  
    // Update only exact matches
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const match of exactMatches) {
        await client.query(`
          UPDATE player_rating 
          SET development_trait_id = $1
          WHERE player_id = $2 AND iteration_id = $3
        `, [match.devTrait, match.playerId, iterationId]);
      }
      
      await client.query('COMMIT');
      console.log(`Successfully updated ${exactMatches.length} development traits`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async updateDraftPositions(iterationId: number): Promise<void> {
    const maddenToolsData = await this.fetchMaddenToolsData();
    const eaData = await this.getIterationData(iterationId);
    const LAST_PICK = 1728;  // Last possible draft pick
    
    const exactMatches: Array<{playerId: number, draftPosition: number}> = [];
    const defaultPicks: Array<{playerId: number, draftPosition: number}> = [];
    const unmatchedPlayers: Array<string> = [];
    
    for (const eaPlayer of eaData) {
      const match = maddenToolsData.find(mtPlayer => this.isExactMatch(eaPlayer, mtPlayer));
      
      if (match && match.draft_positions && match.draft_positions.length > 0) {
        // Get the lowest draft position (earliest pick)
        const lowestDraftPosition = Math.min(...match.draft_positions);
        
        // Only process if it's a valid draft position
        if (lowestDraftPosition >= 1 && lowestDraftPosition <= LAST_PICK) {
          exactMatches.push({
            playerId: eaPlayer.id,
            draftPosition: lowestDraftPosition
          });
        }
      } else {
        // Add to default picks list for players without draft data
        defaultPicks.push({
          playerId: eaPlayer.id,
          draftPosition: LAST_PICK
        });
      }
    }
  
    // Update draft data in database
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Process both exact matches and default picks
      const allUpdates = [...exactMatches, ...defaultPicks];
      
      for (const update of allUpdates) {
        // Check if draft data already exists
        const existingData = await client.query(`
          SELECT draft_id FROM draft_data 
          WHERE player_id = $1
        `, [update.playerId]);
  
        if (existingData.rows.length === 0) {
          await client.query(`
            INSERT INTO draft_data (player_id, pick_id)
            VALUES ($1, (
              SELECT pick_id 
              FROM draft_pick 
              WHERE overall_pick = $2
            ))
          `, [update.playerId, update.draftPosition]);
        } else {
          console.log(`Draft data already exists for player ID ${update.playerId}`);
        }
      }
      
      await client.query('COMMIT');
      console.log(`Successfully processed ${allUpdates.length} draft positions (${exactMatches.length} actual, ${defaultPicks.length} default)`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating draft data:', error);
      throw error;
    } finally {
      client.release();
    }
  }

    // Update the run method to include draft position updates
    public async run(): Promise<void> {
        try {
        const iterationId = await this.getCurrentIterationId();
        await this.updateDevelopmentTraits(iterationId);
        await this.updateDraftPositions(iterationId);  // Add this line
        } catch (error) {
        console.error('Error updating player data:', error);
        throw error;
        }
    }

  public async close(): Promise<void> {
    console.log('Closing database connection pool...');
    await this.pool.end();
  }

  private async getCurrentIterationId(): Promise<number> {
    const result = await this.pool.query(
      'SELECT iteration_id FROM rating_iteration ORDER BY iteration_id DESC LIMIT 1'
    );
    return result.rows[0].iteration_id;
  }
}

// Script execution
async function main() {
  const updater = new DevelopmentTraitUpdater();
  try {
    await updater.run();
    console.log('Development trait update completed successfully');
  } catch (error) {
    console.error('Failed to update development traits:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export default DevelopmentTraitUpdater;