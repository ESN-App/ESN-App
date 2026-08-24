using System.Globalization;
using System.Text;
using EsnApp.Application.Discounts.Abstractions;
using EsnApp.Domain.Discounts;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class PartnerRepository(AppDbContext context)
    : RepositoryBase<Partner>(context), IPartnerRepository
{
    public override async Task<IReadOnlyList<Partner>> GetAllAsync(
        CancellationToken cancellationToken = default) =>
        await Context.Partners
            .AsNoTracking()
            .Where(partner => partner.Status == PartnerStatus.Active)
            .OrderBy(partner => partner.DisplayOrder)
            .ThenBy(partner => partner.Name)
            .ToListAsync(cancellationToken);

    public override async Task<Partner?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        await Context.Partners
            .AsNoTracking()
            .FirstOrDefaultAsync(
                partner => partner.Id == id && partner.Status == PartnerStatus.Active,
                cancellationToken);

    public async Task<IReadOnlyList<Partner>> GetAdminListAsync(
        PartnerStatus? status,
        CancellationToken cancellationToken = default)
    {
        var query = Context.Partners.AsNoTracking();

        if (status.HasValue)
        {
            query = query.Where(partner => partner.Status == status.Value);
        }

        return await query
            .OrderBy(partner => partner.Status)
            .ThenBy(partner => partner.DisplayOrder)
            .ThenBy(partner => partner.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Partner?> GetAdminByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        await Context.Partners.FirstOrDefaultAsync(
            partner => partner.Id == id,
            cancellationToken);

    public async Task<Partner?> GetAdminBySlugAsync(
        string slug,
        CancellationToken cancellationToken = default)
    {
        var partners = await Context.Partners
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        return partners.FirstOrDefault(p => GenerateSlug(p.Name) == slug);
    }

    public async Task UpdateRangeAsync(
        IReadOnlyCollection<Partner> partners,
        CancellationToken cancellationToken = default)
    {
        Context.Partners.UpdateRange(partners);
        await Context.SaveChangesAsync(cancellationToken);
    }

    private static string GenerateSlug(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            return "partner";

        var normalized = name
            .Replace('ł', 'l')
            .Replace('Ł', 'L')
            .Normalize(NormalizationForm.FormD);

        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(c);
            if (category != UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        var result = sb.ToString()
            .ToLowerInvariant()
            .RegexReplace("[^a-z0-9]+", "-")
            .RegexReplace("^-+|-+$", "");

        return string.IsNullOrEmpty(result) ? "partner" : result;
    }
}

internal static class RegexExtensions
{
    public static string RegexReplace(this string input, string pattern, string replacement)
    {
        return System.Text.RegularExpressions.Regex.Replace(input, pattern, replacement);
    }
}
