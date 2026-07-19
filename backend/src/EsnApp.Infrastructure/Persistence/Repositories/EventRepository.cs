using EsnApp.Application.Events;
using EsnApp.Domain.Events;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class EventRepository(AppDbContext context)
    : RepositoryBase<Event>(context), IEventRepository
{
}
