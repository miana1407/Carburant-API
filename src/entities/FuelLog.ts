import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn
} from "typeorm";
import { Vehicle } from "./Vehicle";
import { Station } from "./Station";

@Entity("fuel_logs")
export class FuelLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Vehicle, (v) => v.fuelLogs, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Vehicle;

  @ManyToOne(() => Station, { nullable: true, eager: false })
  @JoinColumn({ name: "station_id" })
  station: Station;

  @Column({ type: "date" })
  date: Date;

  @Column({ type: "float", comment: "Kilométrage odomètre au moment du plein" })
  kilometres: number;

  @Column({ type: "float" })
  litres: number;

  @Column({ type: "decimal", precision: 10, scale: 3 })
  prix_litre: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  total_cost: number;

  @CreateDateColumn()
  created_at: Date;
}