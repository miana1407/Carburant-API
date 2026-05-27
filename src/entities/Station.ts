import {
  Entity, PrimaryColumn, Column,
  ManyToOne, OneToMany, JoinColumn
} from "typeorm";
import { City } from "./City";
import { FuelPrice } from "./FuelPrice";
import { StockBreakage } from "./StockBreakage";
import { StationClosure } from "./StationClosure";
import { StationService } from "./StationService";

@Entity("stations")
export class Station {
  @PrimaryColumn()
  id: string;

  @Column({ type: "float" })
  latitude: number;

  @Column({ type: "float" })
  longitude: number;

  @Column({ nullable: true })
  cp: string;

  @Column({ nullable: true, comment: "A=Autoroute, R=Route" })
  pop: string;

  @Column({ nullable: true })
  adresse: string;

  @Column({ nullable: true })
  ville: string;

  @Column({ default: false })
  automate_24_24: boolean;

  @ManyToOne(() => City, (c) => c.stations, { nullable: true, eager: false })
  @JoinColumn({ name: "city_id" })
  city: City;

  @OneToMany(() => FuelPrice, (fp) => fp.station)
  fuelPrices: FuelPrice[];

  @OneToMany(() => StockBreakage, (sb) => sb.station)
  breakages: StockBreakage[];

  @OneToMany(() => StationClosure, (sc) => sc.station)
  closures: StationClosure[];

  @OneToMany(() => StationService, (ss) => ss.station)
  services: StationService[];
}