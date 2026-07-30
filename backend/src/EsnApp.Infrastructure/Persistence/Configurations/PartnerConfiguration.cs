using EsnApp.Domain.Discounts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EsnApp.Infrastructure.Persistence.Configurations;

public class PartnerConfiguration : IEntityTypeConfiguration<Partner>
{
    public void Configure(EntityTypeBuilder<Partner> builder)
    {
        builder.Property(partner => partner.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(partner => partner.LogoPath)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(partner => partner.ShortDescription)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(partner => partner.Description)
            .IsRequired();

        builder.Property(partner => partner.Address)
            .HasMaxLength(500);

        builder.Property(partner => partner.WebsiteUrl)
            .HasConversion(
                url => url == null ? null : url.ToString(),
                value => value == null ? null : new Uri(value))
            .HasMaxLength(2000);

        builder.Property(partner => partner.GoogleMapsUrl)
            .HasConversion(
                url => url == null ? null : url.ToString(),
                value => value == null ? null : new Uri(value))
            .HasMaxLength(2000);

        builder.Property(partner => partner.Latitude)
            .HasPrecision(9, 6);

        builder.Property(partner => partner.Longitude)
            .HasPrecision(9, 6);

        builder.Property(partner => partner.Status)
            .IsRequired();

        builder.Property(partner => partner.DisplayOrder)
            .IsRequired();

        builder.HasIndex(partner => new { partner.Status, partner.DisplayOrder });

        builder.HasMany(partner => partner.Discounts)
            .WithOne(discount => discount.Partner)
            .HasForeignKey(discount => discount.PartnerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
