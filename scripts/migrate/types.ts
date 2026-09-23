export interface ColumnInfo {
  column_name: string;
  ordinal_position: number;
  data_type: string | null;
  udt_name: string | null;
  is_nullable: 'YES' | 'NO';
  column_default: string | null;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  is_identity: 'YES' | 'NO';
  is_array: boolean;
  is_enum: boolean;
  enum_values?: string[];
  /** Populated by 2-translate.ts */
  mysql_type?: string;
  mysql_default?: string | null;
  is_auto_increment?: boolean;
}

export interface UniqueConstraint {
  name: string;
  columns: string[];
}

export interface ForeignKey {
  name: string;
  columns: string[];
  ref_table: string;
  ref_columns: string[];
  on_delete?: string;
  on_update?: string;
}

export interface IndexInfo {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface TableInfo {
  table_name: string;
  table_type: string;
  columns: ColumnInfo[];
  primary_key: string[];
  unique_constraints: UniqueConstraint[];
  foreign_keys: ForeignKey[];
  indexes: IndexInfo[];
}

export interface EnumInfo {
  type_name: string;
  values: string[];
}

export interface Schema {
  db_schema: string;
  generated_at: string;
  type_mapping_note: string;
  enums_as_enum_note: string;
  tables: TableInfo[];
  enums: EnumInfo[];
}
