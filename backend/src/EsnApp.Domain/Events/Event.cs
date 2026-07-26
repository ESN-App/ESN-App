using EsnApp.Domain.Common;

namespace EsnApp.Domain.Events;

public class Event : BaseEntity
{
    public required string Title { get; set; }

    public required string ShortDescription { get; set; }

    public required string Description { get; set; }

    public required string Location { get; set; }

    public required DateTimeOffset StartsAt { get; set; }

    public DateTimeOffset? EndsAt { get; set; }

    public string? ImagePath { get; set; }

    public string? RegistrationUrl { get; set; }

    public EventStatus Status { get; set; } = EventStatus.Draft;

    public DateTimeOffset? PublishedAt { get; set; }

    public int? MinimumParticipants { get; set; }

    public int? MaximumParticipants { get; set; }

    public int? CurrentParticipants { get; set; }

    public decimal Price { get; set; }
}
