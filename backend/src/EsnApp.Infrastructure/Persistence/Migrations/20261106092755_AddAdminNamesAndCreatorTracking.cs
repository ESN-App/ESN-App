using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EsnApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminNamesAndCreatorTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CreatedById",
                table: "Partners",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedByName",
                table: "Partners",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedById",
                table: "NewsItems",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedByName",
                table: "NewsItems",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedById",
                table: "InfoArticles",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedByName",
                table: "InfoArticles",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedById",
                table: "Events",
                type: "character varying(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedByName",
                table: "Events",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "AspNetUsers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LastName",
                table: "AspNetUsers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Partners");

            migrationBuilder.DropColumn(
                name: "CreatedByName",
                table: "Partners");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "NewsItems");

            migrationBuilder.DropColumn(
                name: "CreatedByName",
                table: "NewsItems");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "CreatedByName",
                table: "InfoArticles");

            migrationBuilder.DropColumn(
                name: "CreatedById",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "CreatedByName",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastName",
                table: "AspNetUsers");
        }
    }
}
