using EsnApp.Domain.Events;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EsnApp.Infrastructure.Persistence.Configurations;

public class EventConfiguration : IEntityTypeConfiguration<Event>
{
    public void Configure(EntityTypeBuilder<Event> builder)
    {
        builder.Property(entity => entity.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(entity => entity.ShortDescription)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(entity => entity.Description)
            .IsRequired();

        builder.Property(entity => entity.Location)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(entity => entity.GoogleMapsUrl)
            .HasConversion(
                url => url == null ? null : url.ToString(),
                value => value == null ? null : new Uri(value))
            .HasMaxLength(2000);

        builder.Property(entity => entity.Latitude)
            .HasPrecision(9, 6);

        builder.Property(entity => entity.Longitude)
            .HasPrecision(9, 6);

        builder.Property(entity => entity.StartsAt)
            .IsRequired();

        builder.Property(entity => entity.ImagePath)
            .HasMaxLength(2000);

        builder.Property(entity => entity.RegistrationUrl)
            .HasMaxLength(2000);

        builder.Property(entity => entity.Status)
            .IsRequired();

        builder.Property(entity => entity.Price)
            .HasPrecision(10, 2)
            .IsRequired();

        builder.HasIndex(entity => new { entity.Status, entity.StartsAt });
    }
}
