import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn
} from "typeorm";
import { Station } from "./Station";

@Entity("station_closures")
export class StationClosure {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Station, (s) => s.closures, { onDelete: "CASCADE" })
  @JoinColumn({ name: "station_id" })
  station: Station;

  @Column()
  type: string;

  @Column({ type: "timestamp" })
  debut: Date;

  @Column({ type: "timestamp", nullable: true })
  fin: Date;
}