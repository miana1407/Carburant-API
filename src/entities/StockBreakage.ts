import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn
} from "typeorm";
import { Station } from "./Station";
import { FuelType } from "./FuelType";

@Entity("stock_breakages")
export class StockBreakage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Station, (s) => s.breakages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "station_id" })
  station: Station;

  @ManyToOne(() => FuelType, { eager: true })
  @JoinColumn({ name: "fuel_type_id" })
  fuelType: FuelType;

  @Column({ type: "timestamp" })
  debut: Date;

  @Column({ type: "timestamp", nullable: true })
  fin: Date;

  @Column()
  type: string; // "temporaire" | "définitive"
}