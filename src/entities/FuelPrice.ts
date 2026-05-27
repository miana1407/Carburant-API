import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, JoinColumn, Index
} from "typeorm";
import { Station } from "./Station";
import { FuelType } from "./FuelType";

@Entity("fuel_prices")
@Index(["station", "fuelType", "maj"])
export class FuelPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Station, (s) => s.fuelPrices, { onDelete: "CASCADE" })
  @JoinColumn({ name: "station_id" })
  station: Station;

  @ManyToOne(() => FuelType, { eager: true })
  @JoinColumn({ name: "fuel_type_id" })
  fuelType: FuelType;

  @Column({ type: "decimal", precision: 10, scale: 3 })
  valeur: number;

  @Column({ type: "timestamp" })
  maj: Date;

  @CreateDateColumn()
  created_at: Date;
}