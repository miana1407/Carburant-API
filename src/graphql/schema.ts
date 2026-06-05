import { buildSchema } from 'graphql';

export const schema = buildSchema(`
  type City {
    id: ID
    code_insee: String
    nom_standard: String
    nom_sans_accent: String
    dep_code: String
    dep_nom: String
    reg_code: String
    reg_nom: String
    code_postal: String
    latitude: Float
    longitude: Float
    population: Int
    superficie_km2: Float
  }

  type FuelType {
    id: ID
    nom: String
  }

  type FuelPrice {
    id: ID
    valeur: Float
    maj: String
    fuelType: FuelType
  }

  type Station {
    id: ID
    latitude: Float
    longitude: Float
    cp: String
    adresse: String
    ville: String
    automate_24_24: Boolean
    pop: String
    city: City
    fuelPrices: [FuelPrice]
  }

  type FuelStat {
    carburant: String
    moyenne: Float
    min: Float
    max: Float
    ecart_type: Float
    nb_stations: String
  }

  type NationalStats {
    scope: String
    stats: [FuelStat]
  }

  type DepartementStats {
    scope: String
    depCode: String
    stats: [FuelStat]
  }

  type Vehicle {
    id: ID
    nom: String
    marque: String
    modele: String
    annee: Int
    fuelType: FuelType
  }

  type FuelLog {
    id: ID
    date: String
    kilometres: Float
    litres: Float
    prix_litre: Float
    total_cost: Float
  }

  type VehicleStats {
    vehicleId: ID
    vehicleNom: String
    nbPleins: Int
    kilometrageTotal: Float
    totalLitres: Float
    totalDepense: Float
    consommationMoyenne_L100km: Float
    coutParKm: Float
  }

  type Query {
    # Villes
    cities(name: String, dep: String, reg: String, limit: Int): [City]
    cityByInsee(codeInsee: String!): City

    # Stations
    nearbyStations(lat: Float, lon: Float, city: String, radius: Float): [Station]
    station(id: ID!): Station
    stationPriceHistory(id: ID!, fuelType: String, from: String, to: String): [FuelPrice]

    # Prix / Stats
    nationalStats(fuelType: String, from: String, to: String): NationalStats
    departementStats(depCode: String!, fuelType: String, from: String, to: String): DepartementStats

    # Véhicules (isolés par utilisateur via userId)
    vehicles(userId: ID!): [Vehicle]
    vehicle(id: ID!, userId: ID!): Vehicle
    vehicleLogs(vehicleId: ID!, userId: ID!, from: String, to: String): [FuelLog]
    vehicleStats(vehicleId: ID!, userId: ID!, from: String, to: String): VehicleStats
  }
`);