import 'dotenv/config';
import { DataSource } from 'typeorm';
import { User } from './users/user.entity';
import { Poi } from './pois/poi.entity';
import { District } from './districts/district.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'colours_of_safety',
  entities: [User, Poi, District],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
