using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EsnApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ExpandInfoArticles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "InfoArticles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "InfoArticles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<List<string>>(
                name: "ExternalLinks",
                table: "InfoArticles",
                type: "text[]",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "InfoArticles",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "InfoArticles",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "InfoArticles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Summary",
                table: "InfoArticles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            // Preserve legacy articles as publicly visible and give every existing
            // row a deterministic unique slug before the unique index is created.
            migrationBuilder.Sql(
                """
                UPDATE "InfoArticles"
                SET "Slug" = 'legacy-' || lower(replace("Id"::text, '-', '')),
                    "Summary" = left("Content", 500),
                    "Category" = 'General',
                    "Status" = 1;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_InfoArticles_Slug",
                table: "InfoArticles",
                column: "Slug",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_InfoArticles_Status_Category_DisplayOrder",
                table: "InfoArticles",
                columns: new[] { "Status", "Category", "DisplayOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_InfoArticles_Slug",
                table: "InfoArticles");

            migrationBuilder.DropIndex(
                name: "IX_InfoArticles_Status_Category_DisplayOrder",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "ExternalLinks",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "Summary",
                table: "InfoArticles");
        }
    }
}
