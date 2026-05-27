import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn
} from "typeorm";
import { Station } from "./Station";

@Entity("station_services")
export class StationService {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Station, (s) => s.services, { onDelete: "CASCADE" })
  @JoinColumn({ name: "station_id" })
  station: Station;

  @Column()
  nom: string;
}