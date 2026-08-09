using EsnApp.Application.Events.Abstractions;
using EsnApp.Domain.Events;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class EventRepository(AppDbContext context)
    : RepositoryBase<Event>(context), IEventRepository
{
    public async Task<Event?> GetPublicByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        await Context.Events
            .AsNoTracking()
            .FirstOrDefaultAsync(
                entity => entity.Id == id
                    && (entity.Status == EventStatus.Published
                        || entity.Status == EventStatus.Cancelled),
                cancellationToken);

    public async Task<EventPage> GetPublicPageAsync(
        DateTimeOffset from,
        DateTimeOffset to,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = Context.Events
            .AsNoTracking()
            .Where(entity =>
                (entity.Status == EventStatus.Published || entity.Status == EventStatus.Cancelled)
                && entity.StartsAt >= from
                && entity.StartsAt < to);

        return await ToPageAsync(query, page, pageSize, cancellationToken);
    }

    public async Task<EventPage> GetAdminPageAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        return await ToPageAsync(Context.Events.AsNoTracking(), page, pageSize, cancellationToken);
    }

    private static async Task<EventPage> ToPageAsync(
        IQueryable<Event> query,
        int page,
        int pageSize,
        CancellationToken cancellationToken)
    {
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(entity => entity.StartsAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new EventPage(items, totalCount);
    }
}
