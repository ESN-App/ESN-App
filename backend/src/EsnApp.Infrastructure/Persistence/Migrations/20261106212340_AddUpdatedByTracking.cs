using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EsnApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUpdatedByTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UpdatedById",
                table: "Partners",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedByName",
                table: "Partners",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedById",
                table: "NewsItems",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedByName",
                table: "NewsItems",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedById",
                table: "InfoArticles",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedByName",
                table: "InfoArticles",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedById",
                table: "Events",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedByName",
                table: "Events",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            // Existing rows: the last known editor is the creator (null where untracked).
            foreach (var table in new[] { "Events", "InfoArticles", "NewsItems", "Partners" })
            {
                migrationBuilder.Sql(
                    $"UPDATE \"{table}\" SET \"UpdatedById\" = \"CreatedById\", \"UpdatedByName\" = \"CreatedByName\";");
            }
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Partners");

            migrationBuilder.DropColumn(
                name: "UpdatedByName",
                table: "Partners");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "NewsItems");

            migrationBuilder.DropColumn(
                name: "UpdatedByName",
                table: "NewsItems");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "UpdatedByName",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "UpdatedById",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "UpdatedByName",
                table: "Events");
        }
    }
}
