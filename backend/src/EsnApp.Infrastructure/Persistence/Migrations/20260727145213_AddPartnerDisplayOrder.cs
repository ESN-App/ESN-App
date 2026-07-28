using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EsnApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPartnerDisplayOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Partners_Status_Name",
                table: "Partners");

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "Partners",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                """
                WITH ordered_partners AS (
                    SELECT "Id",
                           CAST(
                               ROW_NUMBER() OVER (
                                   PARTITION BY "Status"
                                   ORDER BY "CreatedAt", "Id"
                               ) - 1
                               AS integer
                           ) AS display_order
                    FROM "Partners"
                )
                UPDATE "Partners" AS partner
                SET "DisplayOrder" = ordered.display_order
                FROM ordered_partners AS ordered
                WHERE partner."Id" = ordered."Id";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Partners_Status_DisplayOrder",
                table: "Partners",
                columns: new[] { "Status", "DisplayOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Partners_Status_DisplayOrder",
                table: "Partners");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "Partners");

            migrationBuilder.CreateIndex(
                name: "IX_Partners_Status_Name",
                table: "Partners",
                columns: new[] { "Status", "Name" });
        }
    }
}
