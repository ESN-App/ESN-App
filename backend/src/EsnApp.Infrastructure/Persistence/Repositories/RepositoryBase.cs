using EsnApp.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public abstract class RepositoryBase<TEntity>(AppDbContext context)
    where TEntity : BaseEntity
{
    protected AppDbContext Context { get; } = context;

    public virtual async Task<IReadOnlyList<TEntity>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Context.Set<TEntity>()
            .AsNoTracking()
            .OrderBy(e => e.CreatedAt)
            .ToListAsync(cancellationToken);

    public virtual async Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await Context.Set<TEntity>()
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);

    public virtual async Task<TEntity> AddAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        Context.Set<TEntity>().Add(entity);
        await Context.SaveChangesAsync(cancellationToken);

        return entity;
    }
}
