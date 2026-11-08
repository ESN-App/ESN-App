using EsnApp.Domain.Settings;

namespace EsnApp.Application.Settings;

public interface ISiteSettingRepository
{
    Task<SiteSetting?> GetByKeyAsync(string key, CancellationToken cancellationToken = default);

    /// <summary>Inserts the setting if its key does not exist yet, otherwise updates it.</summary>
    Task<SiteSetting> UpsertAsync(SiteSetting setting, CancellationToken cancellationToken = default);
}
