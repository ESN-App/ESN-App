namespace EsnApp.Domain.Common;

/// <summary>
/// Entity that remembers which administrator created it and who last edited it. Names are
/// snapshots taken at save time, so they survive renames/deletion of the account and need
/// no Identity join.
/// </summary>
public abstract class CreatorTrackedEntity : BaseEntity
{
    public string? CreatedById { get; set; }

    public string? CreatedByName { get; set; }

    public string? UpdatedById { get; set; }

    public string? UpdatedByName { get; set; }
}
