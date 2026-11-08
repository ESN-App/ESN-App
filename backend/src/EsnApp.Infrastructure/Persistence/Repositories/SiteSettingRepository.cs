using EsnApp.Application.Settings;
using EsnApp.Domain.Settings;
using Microsoft.EntityFrameworkCore;

namespace EsnApp.Infrastructure.Persistence.Repositories;

public class SiteSettingRepository(AppDbContext context) : ISiteSettingRepository
{
    public async Task<SiteSetting?> GetByKeyAsync(string key, CancellationToken cancellationToken = default) =>
        await context.SiteSettings.AsNoTracking().FirstOrDefaultAsync(setting => setting.Key == key, cancellationToken);

    public async Task<SiteSetting> UpsertAsync(SiteSetting setting, CancellationToken cancellationToken = default)
    {
        if (await context.SiteSettings.AnyAsync(s => s.Key == setting.Key, cancellationToken))
            context.SiteSettings.Update(setting);
        else
            context.SiteSettings.Add(setting);
        await context.SaveChangesAsync(cancellationToken);
        return setting;
    }
}
