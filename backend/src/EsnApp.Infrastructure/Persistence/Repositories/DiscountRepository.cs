using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Domain.Discounts;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class DiscountRepository(AppDbContext context)
    : RepositoryBase<Discount>(context), IDiscountRepository
{
    /// <summary>Offers of publicly visible partners only — backs the anonymous discounts list.</summary>
    public override async Task<IReadOnlyList<Discount>> GetAllAsync(CancellationToken cancellationToken = default) =>
        await Context.Discounts
            .AsNoTracking()
            .Include(d => d.Partner)
            .Where(d => d.Partner!.Status == PartnerStatus.Active)
            .OrderBy(d => d.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Discount>> GetAdminListAsync(CancellationToken cancellationToken = default) =>
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

    public async Task<IReadOnlyList<Discount>> GetByPartnerIdAsync(
        Guid partnerId,
        CancellationToken cancellationToken = default) =>
        await Context.Discounts
            .AsNoTracking()
            .Where(d => d.PartnerId == partnerId)
            .OrderBy(d => d.CreatedAt)
            .ToListAsync(cancellationToken);
}
