import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Station } from "./Station";

@Entity("cities")
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code_insee: string;

  @Column()
  nom_standard: string;

  @Column({ nullable: true })
  nom_sans_accent: string;

  @Column({ nullable: true })
  dep_code: string;

  @Column({ nullable: true })
  dep_nom: string;

  @Column({ nullable: true })
  reg_code: string;

  @Column({ nullable: true })
  reg_nom: string;

  @Column({ nullable: true })
  code_postal: string;

  @Column({ type: "float", nullable: true })
  latitude: number;

  @Column({ type: "float", nullable: true })
  longitude: number;

  @Column({ type: "int", nullable: true })
  population: number;

  @Column({ type: "float", nullable: true })
  superficie_km2: number;

  @OneToMany(() => Station, (s) => s.city)
  stations: Station[];
}