using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EsnApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPartnerStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Partners_IsActive_Name",
                table: "Partners");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Partners",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                """
                UPDATE "Partners"
                SET "Status" = CASE
                    WHEN "IsActive" THEN 1
                    ELSE 2
                END;
                """);

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Partners");

            migrationBuilder.CreateIndex(
                name: "IX_Partners_Status_Name",
                table: "Partners",
                columns: new[] { "Status", "Name" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Partners_Status_Name",
                table: "Partners");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Partners",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(
                """
                UPDATE "Partners"
                SET "IsActive" = "Status" = 1;
                """);

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Partners");

            migrationBuilder.CreateIndex(
                name: "IX_Partners_IsActive_Name",
                table: "Partners",
                columns: new[] { "IsActive", "Name" });
        }
    }
}
