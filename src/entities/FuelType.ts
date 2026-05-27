import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("fuel_types")
export class FuelType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nom: string; // Gazole | SP95 | SP98 | GPLc | E10 | E85
}