using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Domain.Discounts;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class DiscountRepository(AppDbContext context)
    : RepositoryBase<Discount>(context), IDiscountRepository
{
    public override async Task<IReadOnlyList<Discount>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Context.Discounts
            .AsNoTracking()
            .Include(d => d.Partner)
            .OrderBy(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

    public override async Task<Discount?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await Context.Discounts
            .AsNoTracking()
            .Include(d => d.Partner)
            .FirstOrDefaultAsync(d => d.Id == id, cancellationToken);
}
