import type { InferInsertModel, InferSelectModel, Table } from 'drizzle-orm';
import type * as schema from './schema';

// supabase-js returns database column names (title_bg), Drizzle infers its own keys (titleBg).
// These types re-key the Drizzle models to the database names.
type DbName<T extends Table, K> = K extends keyof T['_']['columns'] ? T['_']['columns'][K]['_']['name'] : never;
type ByDbName<T extends Table, M> = { [K in keyof M as DbName<T, K>]: M[K] };

export type Row<T extends Table> = ByDbName<T, InferSelectModel<T>>;
export type Insert<T extends Table> = ByDbName<T, InferInsertModel<T>>;

type Relationship<Fk extends string, Column extends string, Referenced extends string> = {
    foreignKeyName: Fk;
    columns: [Column];
    isOneToOne: false;
    referencedRelation: Referenced;
    referencedColumns: ['id'];
};

type TableDef<T extends Table, R extends Relationship<string, string, string>[] = []> = {
    Row: Row<T>;
    Insert: Insert<T>;
    Update: Partial<Insert<T>>;
    Relationships: R;
};

export type Database = {
    public: {
        Tables: {
            projects: TableDef<typeof schema.projects>;
            project_slug_history: TableDef<
                typeof schema.projectSlugHistory,
                [Relationship<'project_slug_history_project_id_projects_id_fk', 'project_id', 'projects'>]
            >;
            project_images: TableDef<typeof schema.projectImages, [Relationship<'project_images_project_id_projects_id_fk', 'project_id', 'projects'>]>;
            rail_panels: TableDef<typeof schema.railPanels>;
            promises: TableDef<typeof schema.promises>;
            stats: TableDef<typeof schema.stats>;
            crews: TableDef<typeof schema.crews>;
            crew_roles: TableDef<typeof schema.crewRoles, [Relationship<'crew_roles_crew_id_crews_id_fk', 'crew_id', 'crews'>]>;
            partner_services: TableDef<typeof schema.partnerServices>;
            partners: TableDef<typeof schema.partners>;
            material_brands: TableDef<typeof schema.materialBrands>;
            eu_programmes: TableDef<typeof schema.euProgrammes>;
            publications: TableDef<
                typeof schema.publications,
                [Relationship<'publications_programme_id_eu_programmes_id_fk', 'programme_id', 'eu_programmes'>]
            >;
            legal_pages: TableDef<typeof schema.legalPages>;
            site_settings: TableDef<typeof schema.siteSettings>;
            enquiries: TableDef<typeof schema.enquiries>;
        };
        Views: { [_ in never]: never };
        Functions: { [_ in never]: never };
        Enums: {
            scope: schema.Scope;
            panel_kind: (typeof schema.panelKind.enumValues)[number];
            crew_key: (typeof schema.crewKey.enumValues)[number];
            scene: (typeof schema.scene.enumValues)[number];
            publication_kind: (typeof schema.publicationKind.enumValues)[number];
        };
        CompositeTypes: { [_ in never]: never };
    };
};

export type TableName = keyof Database['public']['Tables'];
export type Tables<N extends TableName> = Database['public']['Tables'][N]['Row'];
export type TablesInsert<N extends TableName> = Database['public']['Tables'][N]['Insert'];
export type TablesUpdate<N extends TableName> = Database['public']['Tables'][N]['Update'];
