import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type VoteTargetType = 'poi' | 'district';

@Entity('votes')
@Index(['targetId', 'targetType', 'userId'], { unique: true })
@Index(['targetId', 'targetType', 'ipHash'], { unique: true })
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  targetId: string;

  @Column({ type: 'enum', enum: ['poi', 'district'] })
  targetType: VoteTargetType;

  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @Column()
  ipHash: string;

  @Column({ type: 'int', default: 1 })
  value: number;

  @CreateDateColumn()
  createdAt: Date;
}
