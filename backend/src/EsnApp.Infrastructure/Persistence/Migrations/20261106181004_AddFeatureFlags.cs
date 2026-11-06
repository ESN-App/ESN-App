using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EsnApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFeatureFlags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FeatureFlags",
                columns: table => new
                {
                    Key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Enabled = table.Column<bool>(type: "boolean", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureFlags", x => x.Key);
                });

            // Seeded here (not in DbSeeder) so it runs exactly once and never overwrites an admin's toggle.
            migrationBuilder.Sql(
                "INSERT INTO \"FeatureFlags\" (\"Key\", \"Enabled\", \"UpdatedAt\") VALUES ('pastEventTag', TRUE, NOW()) ON CONFLICT (\"Key\") DO NOTHING;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FeatureFlags");
        }
    }
}
