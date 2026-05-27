import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn, CreateDateColumn
} from "typeorm";
import { FuelType } from "./FuelType";
import { FuelLog } from "./FuelLog";
import { User } from "./User";

@Entity("vehicles")
export class Vehicle {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false }) 
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  nom: string;

  @Column({ nullable: true })
  marque: string;

  @Column({ nullable: true })
  modele: string;

  @Column({ nullable: true })
  annee: number;

  @ManyToOne(() => FuelType, { nullable: true, eager: true })
  @JoinColumn({ name: "fuel_type_id" })
  fuelType: FuelType;

  @OneToMany(() => FuelLog, (fl) => fl.vehicle)
  fuelLogs: FuelLog[];

  @CreateDateColumn()
  created_at: Date;
}